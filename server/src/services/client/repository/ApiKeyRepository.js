import logger from '../../../shared/logger.js';
import BaseApiKeyRepository from './BaseApiKeyRepository.js';
import ApiKeyModel from '../../../shared/models/ApiKeys.js';


export default class MongoApiKeyRepository extends BaseApiKeyRepository {
    constructor() {
        super(ApiKeyModel);
    }

    async create(apiKeyData) {
        try {
            const apiKey = new this.model(apiKeyData);
            await apiKey.save();
            logger.info(`API Key created with ID: ${apiKey._id}`);
            return apiKey;
        } catch (err) {
            logger.error(`Error creating API Key in database: ${err.message}`);
            throw err;
        }
    }

    async findByClientId(clientId, filter = {}, options = {}) {
        try {
            const { limit = 10, skip = 0, sort = { createdAt: -1 } } = options;
            const apiKeys = await this.model.find({ clientId, ...filter }).populate('clientId')
                .limit(limit)
                .skip(skip)
                .sort(sort);
            logger.info(`Found ${apiKeys.length} API Keys for client ID: ${clientId}`);
            return apiKeys;
        } catch (err) {
            logger.error(`Error finding API Keys by client ID in database: ${err.message}`);
            throw err;
        }
    }

    async findByKeyValue(keyValue, includeInactive = false) {
        try {
            const filter = includeInactive ? { keyValue } : { keyValue, isActive: true };
            const apiKey = await this.model.findOne(filter).populate('clientId');
            if (!apiKey) {
                logger.error(`API Key with value: ${keyValue} not found`);
                return null;
            }
            logger.info(`API Key found with value: ${keyValue}`);
            return apiKey;
        } catch (err) {
            logger.error(`Error finding API Key by value in database: ${err.message}`);
            throw err;
        }
    }

    async countByClientId(clientId, filter = {}) {
        try {
            const count = await this.model.countDocuments({ clientId, ...filter });
            logger.info(`Counted ${count} API Keys for client ID: ${clientId}`);
            return count;
        } catch (err) {
            logger.error(`Error counting API Keys by client ID in database: ${err.message}`);
            throw err;
        }
    }
}