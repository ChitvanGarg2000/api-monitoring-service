import { z } from 'zod'
import rabbitmq from '../../shared/config/rabbitmq.js'
import postgres from '../../shared/config/postgres.js'
import config from '../../shared/config/index.js'
import mongodb from '../../shared/config/mongo.js'
import logger from '../../shared/config/logger.js'
import processorContainer from './Dependencies/dependency.js'
import { EVENT_TYPES } from '../../shared/events/eventContract.js';
import { RetryStrategy, isRetryable } from '../../shared/events/producer/RetryStrategy.js';
import { CircuitBreaker } from '../../shared/events/producer/CircuitBreaker.js';

const messageSchema = z.object({
    type: z.enum([EVENT_TYPES.API_HIT]),
    data: z.record(z.string(), z.unknown()),
    messageId: z.string().optional(),
    timestamp: z.union([z.string(), z.number()]).optional(),
});

class EventConsumer {
    constructor({ processorService, rabbitmq, mongodb, postgres, config, logger, retryStrategy, circuitBreaker }) {
        this._processorService = processorService;
        this._rabbitmq = rabbitmq;
        this._mongodb = mongodb;
        this._postgres = postgres;
        this._config = config;
        this._logger = logger;
        this._retryStrategy = retryStrategy;
        this._circuitBreaker = circuitBreaker;

        this.isRunning = false;
        this.channel = null;
        this._stats = { processed: 0, failed: 0, retried: 0, dlqRouted: 0, lastProcessedAt: null };
        this._processedIds = new Set();
        this._poisonMessages = new Map(); // messageType -> consecutive failure count
    };

    _connectDatabase = async (maxRetries = 5) => {
        let retries = 0;
        while (retries < maxRetries) {
            try {
                this._logger.info('EventConsumer: connecting to database', { retries });

                Promise.all([
                    this._mongodb.connect(),
                    this._postgres.testConnection(),
                ])
                this._logger.info('EventConsumer: connected to database');
                return;
            } catch (error) {
                retries++;
                this._logger.error('EventConsumer: failed to connect to database', { error: error.message });
                if (retries >= maxRetries) {
                    throw new Error('EventConsumer: failed to connect to database after max retries');
                }
                await new Promise(resolve => setTimeout(resolve, 5000 * retries));
            }
        }
    }

    _reconnect = async () => {
        try {
            await this._connectDatabase();
            this.channel = await this._rabbitmq.connect()
            const prefetchLimit = this._config.consumer?.prefetchLimit || 10;
            this.channel.prefetch(prefetchLimit);
            this._logger.info('EventConsumer: successfully reconnected to database and channel');

            this.channel.on('error', (error) => {
                this._logger.error('EventConsumer: channel error', { error: error.message });
                this._circuitBreaker.onFailure();
            })
            this.channel.on('close', () => {
                this._logger.warn('EventConsumer: channel closed unexpectedly');
                if (this.isRunning) this._reconnect()
            })

            await this.channel.consume(this._rabbitmq.queue, async (message) => {
                if (message) {
                    await this._handleMessage(message)
                };
            }, { noAck: false, consumerTag: `consumer-${Date.now()}` })

        } catch (error) {
            this._logger.error('EventConsumer: failed to reconnect to database', { error: error.message });
            if (this.isRunning) {
                setTimeout(() => this._reconnect(), 10000);
            }
        }
    }

    _cleanup = async () => {
        try {
            this.isRunning = false;
            if (this.channel) {
                this.channel.close();
                this.channel = null;
            }
        } catch (error) {
            this._logger.error('EventConsumer: failed to cleanup', { error: error.message });
            throw error;
        }
    }

    _parseMessage = async (message) => {
        try {
            const content = message.content?.toString();
            if (!content) {
                throw new Error('EventConsumer: invalid message content');
            }

            const messageData = JSON.parse(content);
            const parsedMessage = messageSchema.safeParse(messageData);
            if (!parsedMessage.success) {
                throw new Error('EventConsumer: invalid message schema ' + parsedMessage.error.issues.map(issue => issue.path.join('.') + ' ' + issue.message).join(', '));
            }

            return {
                ...parsedMessage.data,
                messageId: message.properties.messageId || messageData.messageId || "unknown",
                retryCount: parseInt(message.properties.headers?.['x-retry-count'] || 0)
            }

        } catch (error) {
            this._logger.error('EventConsumer: failed to parse message', { error: error.message });
            throw new Error('EventConsumer: failed to parse message ' + error.message);
        }
    }


    _handleMessage = async (message) => {
        if (!this._circuitBreaker.allowRequest()) {
            this._logger.warn('EventConsumer: circuit breaker is open, skipping message');
            this.channel.nack(message, false, true);
            return;
        }

        const startTime = Date.now();
        let messageData = null;

        messageData = this._parseMessage(message);

        // handling Idempotency

        if (this._processedIds.has(messageData.messageId)) {
            this._logger.info('EventConsumer: message already processed, skipping', { messageId: messageData.messageId });
            this.channel.ack(message);
            return;
        }
        try {

            await this._processMessage(messageData);

            this.channel.ack(message);

            this._circuitBreaker.onSuccess();
            this._stats.processed++;
            this._stats.lastProcessedAt = Date.now();

            this._processedIds.add(messageData.messageId);

            if (this._processedIds.size > 100_00) {
                const first = this._processedIds.values().next().value();
                this._processedIds.delete(first);
            }

            this._poisonMessages.delete(messageData.type);
        } catch (error) {
            this._handleProcessingError(error, message, messageData, startTime);
        }
    }

    _handleProcessingError = async (error, message, messageData, startTime) => {
        const messageId = messageData?.messageId || message.properties.messageId || "unknown";
        const retryCount = messageData?.retryCount || 0;
        this._circuitBreaker.onFailure();
        this._stats.failed++;

        const eventType = messageData?.type || message.properties.headers?.['x-event-type'] || "unknown";
        const poisonCount = (this._poisonMessages.get(eventType) || 0) + 1;

        this._poisonMessages.set(eventType, poisonCount);

        if (poisonCount >= 10) {
            this._logger.error('Poison message detected for event type ' + eventType + ', routing to DLQ');
        }

        try {
            if (!isRetryable(error) || !this._retryStrategy.shouldRetry(retryCount)) {
                await this._sendToDLQ(message, error, retryCount >= this._retryStrategy.maxRetries ? 'MAX_RETRIES_REACHED' : 'NON_RETRYABLE');
                return;
            }

            await this._retryMessage(message, retryCount);
        } catch (err) {
            this._logger.error('EventConsumer: failed to handle processing error', { error: err.message });
            throw new Error('EventConsumer: failed to handle processing error ' + err.message);
        }
    }

    _sendToDLQ = async (message, error, reason) => {
        try {
            const dlqName = `${this._config.rabbitmq.queue}.dlq`;
            this.channel.sendToQueue(dlqName, message.content, {
                ...message.properties,
                persistent: true,
                headers: {
                    ...message.properties.headers,
                    'x-dlq-reason': reason,
                    'x-dlq-error': error.message,
                    'x-dlq-timestamp': Date.now(),
                    'x-original-queue': this._config.rabbitmq.queue,
                }
            })

            this.channel.ack(message);
            this._stats.dlqRouted++;

        } catch (error) {
            this._logger.error('EventConsumer: failed to send message to DLQ', { error: error.message });
            this.channel.nack(message, false, true);
        }
    }

    _retryMessage = async (message, retryCount) => {

        const delay = this._retryStrategy.delay(retryCount);

        const retryHeaders = {
            ...message.properties.headers,
            'x-retry-count': retryCount + 1,
            'x-retry-timestamp': Date.now(),
            'x-retry-delay': delay,
            'x-original-queue': this._config.rabbitmq.queue,
        }

        this.channel.sendToQueue(this._config.rabbitmq.queue, message.content, {
            ...message.properties,
            persistent: true,
            headers: retryHeaders,
        })

        await new Promise(resolve => setTimeout(resolve, delay));
        setTimeout(() => {
            try {
                this.channel.sendToQueue(this._config.rabbitmq.queue, message.content, {
                    ...message.properties,
                    persistent: true,
                    headers: retryHeaders,
                })
                this._logger.info('EventConsumer: message retried', { messageId: message.properties.messageId, retryCount: retryCount + 1, delay });
            } catch (error) {
                this._logger.error('EventConsumer: failed to retry message', { error: error.message });
                this._sendToDLQ(message, error, 'FAILED_TO_RETRY_MESSAGE');
            }
        }, delay);

        this.channel.ack(message);
        this._stats.retried++;
    }

    _processMessage = async (messageData) => {
        try {
            switch (messageData.type) {
                case EVENT_TYPES.API_HIT:
                    this._processorService.processEvent(messageData.data);
                    break;
                default:
                    throw new Error('EventConsumer: unsupported message type ' + messageData.type);
            }

        } catch (error) {
            this._logger.error('EventConsumer: failed to process message', { error: error.message });
            throw error;
        }
    }

    start = async () => {
        try {

            new Promise(resolve => setTimeout(resolve, 5000))
            await this._connectDatabase();
            this._rabbitmq.connect()

            const prefetchLimit = this._config.consumer?.prefetchLimit || 10;
            this.channel.prefetch(prefetchLimit);

            this.channel.on('error', (error) => {
                this._logger.error('EventConsumer: channel error', { error: error.message });
                this._circuitBreaker.onFailure();
            })
            this.channel.on('close', () => {
                this._logger.warn('EventConsumer: channel closed unexpectedly');
                if (this.isRunning) this._reconnect()
            })

            await this.channel.consume(this._rabbitmq.queue, async (message) => {
                if (message) {
                    await this._handleMessage(message)
                };
            }, { noAck: false, consumerTag: `consumer-${Date.now()}` })
        } catch (error) {
            this._logger.error('EventConsumer: failed to start', { error: error.message });
            await this._cleanup();
            throw error;
        }
    }

    stop = async () => {
        try {
            await this._cleanup();

            await Promise.all([
                this._mongodb.disconnect(),
                this._postgres.close(),
                this._rabbitmq.close(),
            ])
        } catch (error) {
            this._logger.error('EventConsumer: failed to stop', { error: error.message });
            throw error;
        }

    }
}

const circuitBreaker = new CircuitBreaker({
    failureThreshold: config.rabbitmq.circuitBreaker.failureThreshold ?? 5,
    cooldownMs: config.rabbitmq.circuitBreaker.cooldownMs ?? 3000,
    halfOpenMaxAttempts: config.rabbitmq.circuitBreaker.halfOpenMaxAttempts ?? 3,
    logger: log
})

const retryStrategy = new RetryStrategy({
    maxRetries: config.rabbitmq.retryAttempts ?? 3,
    baseDelayMs: config.rabbitmq.retryDelayMs ?? 1000,
    maxDelayMs: 5000,
    jitterFactor: 0.3
})


const consumer = new EventConsumer({
    processorService: processorContainer.services.processorService,
    rabbitmq: rabbitmq,
    mongodb: mongodb,
    postgres: postgres,
    config: config,
    logger: logger,
    retryStrategy: retryStrategy,
    circuitBreaker: circuitBreaker
})

const startConsumerWithRetry = async () => {
    const startupRetry = new RetryStrategy({
        maxRetries: 5,
        baseDelayMs: 5000,
        maxDelayMs: 30_000,
    })

    let attempt = 0;
    while(startupRetry.shouldRetry(attempt) || attempt === 0) {
        try {
            logger.info('EventConsumer: starting consumer with retry', { attempt: attempt + 1 });
            await consumer.start();
            logger.info('EventConsumer: consumer started successfully');
            return;
        } catch (error) {
            attempt++;
            logger.error('EventConsumer: failed to start consumer with retry', { error: error.message });

            if(!startupRetry.shouldRetry(attempt)) {
                logger.error('Max retries reached, exiting...')
                process.exit(1);

            }
            await startupRetry.wait(attempt - 1);
        }
    }
}

process.on('SIGINT', async () => {
    try {
        logger.info('EventConsumer: received SIGINT, stopping consumer');
        await consumer.stop();
        logger.info('EventConsumer: consumer stopped successfully');
        process.exit(0);
    } catch (error) {
        logger.error('EventConsumer: failed to stop consumer', { error: error.message });
        process.exit(1);
    }
})

process.on('SIGTERM', async () => {
    try {
        logger.info('EventConsumer: received SIGTERM, stopping consumer');
        await consumer.stop();
        logger.info('EventConsumer: consumer stopped successfully');
        process.exit(0);
    } catch (error) {
        logger.error('EventConsumer: failed to stop consumer', { error: error.message });
        process.exit(1);
    }
})

process.on('uncaughtException', async (error) => {
    try {
        logger.error('EventConsumer: uncaught exception', { error: error.message });
        await consumer.stop();
        logger.info('EventConsumer: consumer stopped successfully');
        process.exit(1);
    } catch (error) {
        logger.error('EventConsumer: failed to stop consumer', { error: error.message });
        process.exit(1);
    }
})

process.on('unhandledRejection', async (error) => {
    logger.error('EventConsumer: unhandled rejection', { error: error.message });
    process.exit(1);
})

startConsumerWithRetry()

export default consumer;