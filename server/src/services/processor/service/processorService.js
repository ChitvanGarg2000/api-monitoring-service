import logger from '../../../shared/config/logger.js'

export class ProcessorService {
    constructor({apiHitsRepository, metricsRepository}){
        if(!apiHitsRepository || !metricsRepository){
            throw new Error('apiHitsRepository and metricsRepository are required')
        }
        this.apiHitsRepository = apiHitsRepository
        this.metricsRepository = metricsRepository
    }

    getTimeBucket = async (timeStamp, interval='hour') => {
        const date = new Date(timeStamp)

        switch(interval){
            case 'hour':
                return date.setMinutes(0, 0, 0)
            case 'day':
                return date.setHours(0, 0, 0)
            case 'minute':
                return date.setSeconds(0, 0)
            default:
                date.setMinutes(0, 0, 0)
        }

        return date;
    }

    getOverallStats = async (clientId, startTime = null, endTime = null) => {
        return this.metricsRepository.getOverallStats(clientId, startTime, endTime)
    }

    processEvent = async (event) => {
        let rawEventSaved = false;
        try {
            logger.info('ProcessorService: processing event', event)

            // STEP 1: Save the raw event to the apiHitsRepository
            // Fail the entire process if the raw event is not saved
            await this.apiHitsRepository.save(event)
            rawEventSaved = true;

            logger.info('ProcessorService: saved event', {eventId: event.id})

            // STEP 2: do not fail the entire process if the metrics update fails
            await this._updateMetricsWithFallback(eventData)

            logger.info('ProcessorService: updated metrics', {eventId: event.eventId})

        } catch (error) {
        }
    }
}