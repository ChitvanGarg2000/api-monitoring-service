import dotenv from 'dotenv'

dotenv.config()

const config = {
    node_env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || "8000", 10),

    postgres: { 
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER || 'chitvan',
        password: process.env.POSTGRES_PASSWORD || 'chitvan0305',
        database: process.env.POSTGRES_DB || 'api_monitoring',
    },

    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/api_monitoring_db',
        db_name: process.env.MONGODB_DB || 'api_monitoring_db'
    },

    rabbitmq: {
        uri: process.env.RABBITMQ_URI || 'amqp://localhost:15672',
        queue: process.env.RABBITMQ_QUEUE || 'api_monitoring_queue',
        publisherConfirm: process.env.RABBITMQ_PUBLISHER_CONFIRM === 'true' || false,
        retryAttempts: parseInt(process.env.RABBITMQ_RETRY_ATTEMPTS || '5', 10),
        retryDelay: parseInt(process.env.RABBITMQ_RETRY_DELAY || '1000', 10),
    },

    jwt: {
        secret: process.env.JWT_SECRET || '2rN2ttSvP4KIHc4wojcpehe6Q6OnLmj6uWYPtqQ9ZzR',
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },

    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // limit each IP to 1000 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
    },

    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}

export default config