import logger from "../shared/config/logger.js";
import mongodb from "../shared/config/mongo.js";
import postgres from "../shared/config/postgres.js";
import rabbitmq from "../shared/config/rabbitmq.js";
import config from "../shared/config/index.js";

const initializeConnections = async () => {
    try {
        await Promise.all([
            mongodb.connect(),
            postgres.testConnection(),
            rabbitmq.connect(),
        ])
        logger.info("All database connections established successfully")
    } catch (error) {
        logger.error("Error establishing database connections", error)
        throw error
    }
}

const closeConnections = async () => {
    try {
        await Promise.all([
            mongodb.disconnect(),
            postgres.disconnect(),
            rabbitmq.close(),
        ])
        logger.info("All database connections closed successfully")
    } catch (error) {
        logger.error("Error closing database connections", error)
        throw error
    }
}

export { initializeConnections, closeConnections }