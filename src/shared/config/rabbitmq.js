import config from "./index";
import logger from "./logger";
import amqp from "amqplib"

class RabbitMQConnection {
    constructor() {
        this.connection = null
        this.channel = null
        this.isConnecting = false
    }

    async connect() {
        try {
            if (this.connection) {
                logger.info('RabbitMQ already connected')
                return this.connection
            }

            if (this.isConnecting) {
                await new Promise((resolve) => {
                    const interval = setInterval(() => {
                        if (!this.isConnecting) {
                            clearInterval(interval)
                            resolve()
                        }
                    }, 100)
                })
                return this.channel
            }

            this.isConnecting = true
            logger.info('Connecting to Rabbit MQ', config.rabbitmq.uri)
            this.connection = await amqp.connect(config.rabbitmq.uri)
            this.channel = await this.connection.createChannel()

            // Creating Queue | key name
            const dlqName = `${config.rabbitmq.queue}.dlq`

            await this.channel.assertQueue(dlqName, {
                durable: true,
            })

            // Normal queue
            await this.channel.assertQueue(config.rabbitmq.queue, {
                durable: true,
                arguments: {
                    "x-dead-letter-exchange": "",
                    "x-dead-letter-routing-key": dlqName
                }
            })
            logger.info('RabbitMQ connected')
            this.isConnecting = false
            return this.channel

        } catch (error) {
            this.isConnecting = false
            logger.error('RabbitMQ connection error: ', error)
            throw error
        }
    }

    async close() {
        try {
            if (this.channel) {
                await this.channel.close()
                this.channel = null
            }
            if (this.connection) {
                await this.connection.close()
                this.connection = null
            }
            logger.info('RabbitMQ disconnected')
        } catch (error) {
            logger.error('RabbitMQ close error: ', error)
            process.exit(1)
        }

    }

    async isConnected() {
        return this.connection && this.connection.isConnected()
    }

    async getChannel() {
        return this.channel
    }

    async getStatus() {
        if (!!this.connect || !!this.channel) return 'disconnected'
        if (this.isConnecting) return 'connecting'
        return 'connected'
    }

    async sendToQueue(queue, message) {
        try {
            if (!this.channel) {
                await this.connect()
            }
            await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
                persistent: true,
            })
            logger.info('Message sent to queue')
            return true
        } catch (error) {
            logger.error('Error sending message to queue: ', error)
            return false
        }
    }

    async consumeFromQueue(queue, callback) {
        try {
            if (!this.channel) {
                await this.connect()
            }
            await this.channel.consume(queue, (msg) => {
                if (msg) {
                    callback(JSON.parse(msg.content.toString()))
                    this.channel.ack(msg)
                }
            })
            logger.info('Message consumed from queue')
            return true
        } catch (error) {
            logger.error('Error consuming message from queue: ', error)
            return false
        }
    }
}
