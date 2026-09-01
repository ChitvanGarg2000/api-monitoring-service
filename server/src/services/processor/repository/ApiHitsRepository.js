import { BaseRepository } from "./BaseRepository";

export class ApiHitsRepository extends BaseRepository{
    constructor({model, logger: l}){
        super({logger: l})

        if(!model) throw new Error("ApiHitRepository requires mongo model");
        this.model = model;
    }

    save = async (eventData) => {
        try {
            const doc = new this.model(eventData)
            await doc.save()

            this.logger.info(`ApiHitsRepository: saved one record`, { eventId: eventData.eventId});
        } catch (error) {
            if(error && error.code === 11000){
                this.logger.warn('Duplicated event id, skipping save', {eventId: eventData.eventId})
                return null
            }
            this.logger.error(`ApiHitsRepository: save failed - ${error.message}`);
            throw error;
        }
    }

    find = async (filter={}, options={}) => {
        try {
            const {limit=100, skip=0, sort={timestamp: -1}} = options
            const hits = await this.model.find(filter).sort(sort).skip(skip).limit(limit).lean()

            this.logger.info(`ApiHitsRepository: found ${hits.length} hits`)
            return hits
        } catch (error) {
            this.logger.error(`ApiHitsRepository: find failed - ${error.message}`);
            throw error;
        }
    }

    count = async (filter = {}) => {
        try {
            const count = await this.model.countDocuments(filter)
            this.logger.info(`ApiHitsRepository: found ${count} hits`)
            return count
        } catch (error) {
            this.logger.error(`ApiHitsRepository: count failed - ${error.message}`);
            throw error;
        }
    }

    deleteOldHits = async (beforeTime) => {
        try {
            const result = await this.model.deleteMany({ timestamp: { $lt: beforeTime } })
            
            this.logger.info(`ApiHitsRepository: deleted ${result.deletedCount} old hits`)
            return result.deletedCount
        } catch (error) {
            this.logger.error(`ApiHitsRepository: deleteOldHits failed - ${error.message}`);
            throw error;
        }
    }
}