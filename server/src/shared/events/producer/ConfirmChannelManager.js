import { EventEmitter } from 'node:events'

export class ConfirmChannelManager extends EventEmitter {
    constructor(rabbitmg, logger){
        super()

        if(!rabbitmg) throw new Error("ConfirmChannelManager requires a rabbitmq instance")

        this._logger = logger ?? console
        this._rmq = rabbitmg
        this._channel = null
        this._connecting = false
        this._connectWaiters = []
    }
 
    _connect = async () => {
        this._connecting = true
        try {
            let connection
            if(this._rmq.connection){
                connection = this._rmq.connection
            }else{
                await this._rmq.connect()
                if(!this._rmq.connection) throw new Error("Failed to get a connection from RabbitMQ instance")
                connection = this._rmq.connection
            }


            const confirmChannel = await connection.createConfirmChannel()
            confirmChannel.on('drain',() => this.emit('drain'))
            confirmChannel.on('close', () => {
                this._logger.warn('[ChannelManager] Confirm channel closed, ')     
                this._channel = null;               
            })

            confirmChannel.on('error', (err) => {
                this._logger.error('[ChannelManager] Confirm channel error', {
                    message: err.message,
                    stack: err.stack,
                    code: err.code
                });
                this._channel = null
                this.emit('error', err)
            })

            this._channel = confirmChannel
            this._logger.info('Confirm channel created successfully')

            for(const w of this._connectWaiters) w.resolve(confirmChannel)
            this._connectWaiters = []
            return this._channel

        } catch (error) {
            this._logger.error(`Error creating confirm channel ${error.message}`)
            for(const w of this._connectWaiters) w.reject(error)
            this._connectWaiters = []
            return error
        } finally{
            this.connecting = false
        }
    }
    /**
     * Get or create a confirmed channel
     * @returns {Promise<import('amqplib').ConfirmChannel>}
     */
    getChannel = async () => {
        try {
            if(this._channel) return this._channel

            if(this._connecting){
                return new Promise((resolve,reject)=>{
                    this._connectWaiters.push({resolve,reject})
                })
            }

            return this._connect
        } catch (error) {
            this._logger.error(`Error creating confirm channel ${error.message}`)
        }
    }


    
}