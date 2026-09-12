import logger from '../../../shared/config/logger.js'

export class ProcessorService {
    constructor({ apiHitsRepository, metricsRepository }) {
        if (!apiHitsRepository || !metricsRepository) {
            throw new Error('apiHitsRepository and metricsRepository are required')
        }
        this.apiHitsRepository = apiHitsRepository
        this.metricsRepository = metricsRepository
    }

    getTimeBucket = async (timeStamp, interval = 'hour') => {
        const date = new Date(timeStamp)

        switch (interval) {
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

    _updateMetricsWithFallback = async (eventData) => {
        // Calculate time bucket 

        try {
            const timeBucket = this.getTimeBucket(eventData.timestamp, "hour")
            const metricsData = {
                clientId: eventData.clientId.toString(),
                serviceName: eventData.serviceName,
                endpoint: eventData.endpoint,
                method: eventData.method,
                totalHits: 1,
                errorHits: eventData.statusCode > 400 ? 1 : 0,
                avgLatency: eventData.latencyMs,
                minLatency: eventData.latencyMs,
                maxLatency: eventData.latencyMs,
                timeBucket,
            }
    
            await this.metricsRepository.upsertEndpointMetrics(metricsData)
        }catch(error){
            logger.error('ProcessorService: failed to update metrics with fallback', {
                error: error.message,
                eventId: eventData.id
            })
            throw error
        }
       
    }

    cleanUpEvent = async (daysToKeep = 30) => {
        try {
            let cutoffDate = new Date()
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)
            await this.apiHitsRepository.deleteOldEvents(cutoffDate)
            logger.info('ProcessorService: cleaned up old events', { cutoffDate })
        } catch (error) {
            logger.error('ProcessorService: failed to clean up old events', {
                error: error.message,
                daysToKeep: daysToKeep,
            })
            throw error
        }
    }
    
    processEvent = async (event) => {
        let rawEventSaved = false;
        try {
            logger.info('ProcessorService: processing event', event)

            // STEP 1: Save the raw event to the apiHitsRepository
            // Fail the entire process if the raw event is not saved
            await this.apiHitsRepository.save(event)
            rawEventSaved = true;

            logger.info('ProcessorService: saved event', { eventId: event.id })

            // STEP 2: do not fail the entire process if the metrics update fails
            await this._updateMetricsWithFallback(event)

            logger.info('ProcessorService: updated metrics', { eventId: event.eventId })

        } catch (error) {
            if (!rawEventSaved) {
                logger.error('ProcessorService: failed to save raw event', {
                    error: error.message,
                    eventId: event.id
                })
                throw error
            }

            logger.error('Non-critical error in ProcessorService: processing event', {
                error: error.message,
                eventId: event.id
            })
        }
    }
}