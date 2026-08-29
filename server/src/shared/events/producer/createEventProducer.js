import config from "../../config/index.js";
import logger from "../../config/logger.js";
import rabbitmq from "../../config/rabbitmq.js";
import CircuitBreaker from "./CircuitBreaker.js";
import { ConfirmChannelManager } from "./ConfirmChannelManager.js";
import { RetryStrategy } from "./RetryStrategy.js";
import { EventProducer } from "./eventProducer.js";

export const createEventProducer = (overrides={}) => {
    const log = overrides.logger ?? logger
    const rmq = overrides.rabbitmq ?? rabbitmq
    const queueName = overrides.queueName ?? config.rabbitmq.queue

    if(!rmq) throw new Error("RabbitMQ instance not provided")
    if(!queueName) throw new Error("Queue name not provided")

    if(!config.rabbitmq.retryAttempts || !config.rabbitmq.retryAttempts < 0){
        throw new Error('Invalid retry attempts configuration')
    }

    const channelManager = overrides.channelManager ?? new ConfirmChannelManager(rmq, log)
    const circuitBreaker = overrides.circuitBreaker ?? new CircuitBreaker({
        failureThreshold: config.rabbitmq.circuitBreaker.failureThreshold ?? 5,
        cooldownMs: config.rabbitmq.circuitBreaker.cooldownMs ?? 3000,
        halfOpenMaxAttempts: config.rabbitmq.circuitBreaker.halfOpenMaxAttempts ?? 3,
        logger: log
    })

    const retryStrategy = overrides.retryStrategy ?? new RetryStrategy({
        maxRetries: config.rabbitmq.retryAttempts ?? 3,
        baseDelayMs: config.rabbitmq.retryDelayMs ?? 1000,
        maxDelayMs: 5000,
        jitterFactor: 0.3
    })


    return new EventProducer({ circuitBreaker, channelManager, retryStrategy, queueName, logger: log })
    
    

    
}