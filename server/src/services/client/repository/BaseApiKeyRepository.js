export default class BaseApiKeyRepository {
    constructor(model) {
        this.model = model;
    }

    async create(apiKeyData) {
        throw new Error('Method not implemented');
    }

    async findByClientId(clientId, filter = {}, options = {}) {
        throw new Error('Method not implemented');
    }

    async findByKeyValue(keyValue, includeInactive = false) {
        throw new Error('Method not implemented');
    }

    async countByClientId(clientId, filter = {}) {
        throw new Error('Method not implemented');
    }
}