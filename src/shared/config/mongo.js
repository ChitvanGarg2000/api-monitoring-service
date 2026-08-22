import mongoose from 'mongoose'
import config from './index'
import logger from './logger'

class MongoConnection{
    constructor(){
        this.connection = null
    }

    /** 
     * connect mongo db 
     * @return {Promise<mongoose.Connection>}
    */
    async connect(){
        try{
            if(this.connection){
                logger.info('MongoDB already connected')
                return this.connection
            }

            await mongoose.connect(config.mongodb.uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                connectTimeoutMS: 10000,
                dbName: config.mongodb.db_name
            })

            this.connection = mongoose.connection
            
            logger.info('MongoDB connected')

            this.connection.on('error', (err) => {
                logger.error('MongoDB connection error: ', err)
                process.exit(1)
            })

            this.connection.on('disconnected', () => {
                logger.error('MongoDB disconnected')
                process.exit(1)
            })

            return this.connection
        }catch(error){
            logger.error('MongoDB connection error: ', error)
            process.exit(1)
        }
    }

    async disconnect(){
        try{
            if(this.connection){
                await this.connection.disconnect()
                this.connection = null
                logger.info('MongoDB disconnected')
            }
        }catch(error){
            logger.error('MongoDB disconnection error: ', error)
            process.exit(1)
        }
    }

    async isConnected(){
        return this.connection && this.connection.readyState === 1
    }

    async getDb(){
        return this.connection ? this.connection.db : null
    }
}


export default new MongoConnection()