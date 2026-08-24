import pg from 'pg'
import config from './index.js'
import logger from './logger.js'

class PostgresConnection {
    constructor() {
        this.pool = null
    }

    async getPool() {
        try {
            if (this.pool) {
                logger.info('PostgreSQL already connected')
                return this.pool
            }

            this.pool = new pg.Pool({
                host: config.postgres.host,
                port: config.postgres.port,
                user: config.postgres.user,
                password: config.postgres.password,
                database: config.postgres.database,
                max: 20,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 2000,
            })

            logger.info('PostgreSQL connected')

            this.pool.on('error', (err) => {
                logger.error('PostgreSQL connection error: ', err)
                process.exit(1)
            })

            this.pool.on('connect', () => {
                logger.info('PostgreSQL connected')
            })

            return this.pool
        } catch (error) {
            logger.error('PostgreSQL connection error: ', error)
            process.exit(1)
        }
    }

    async disconnect() {
        try {
            if (this.pool) {
                await this.pool.end()
                this.pool = null
                logger.info('PostgreSQL disconnected')
            }
        } catch (error) {
            logger.error('PostgreSQL disconnection error: ', error)
            process.exit(1)
        }
    }


    async testConnection() {
        try {
            const pool = await this.getPool()
            const client = await pool.connect()
            await client.query('SELECT NOW()')
            client.release()

            logger.info('PostgreSQL connection test successful')
            return true
        } catch (error) {
            logger.error('PostgreSQL connection test failed: ', error)
            return false
        }
    }

    async query(query, params) {
        const startTime = Date.now()
        try {
            const pool = await this.getPool()
            const result = await pool.query(query, params)
            const duration = Date.now() - startTime
            logger.info(`PostgreSQL query executed in ${duration}ms`)
            return result
        } catch (error) {
            logger.error('PostgreSQL query error: ', error)
            throw error
        }
    }

    async closePool() {
        if (this.pool) {
            await this.pool.end()
            this.pool = null
            logger.info('PostgreSQL pool closed')
        }
    }
}

export default new PostgresConnection()