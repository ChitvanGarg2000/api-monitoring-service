import AppError from "../../../shared/utils/AppError.js";
import logger from "../../../shared/config/logger.js";
import { v4 as uuidv4} from 'uuid'

class IngestService{
    constructor({eventProducer}){
        if(!eventProducer) throw new Error('eventProducer is required');
        this.eventProducer = eventProducer
    }

    validateHitData = (hitData) => {
        const requiredFields = [
            'serviceName',
            'endpoint',
            'method',
            'statusCode',
            'latencyMs',
            'clientId'
        ]

        const missingFields = requiredFields.filter(field => !hitData[field])

        if(missingFields.length > 0){
            throw new AppError(`Missing required fields: ${missingFields.join(', ')}`, 400)
        }

        const validMethods = ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS', 'HEAD']

        if(!validMethods.includes(hitData.method.toUpperCase())){
            throw new AppError(`Invalid HTTP method: ${hitData.method}`, 400)
        }
        
        const statusCode = parseInt(hitData.statusCode, 10)
        if(isNaN(statusCode) || statusCode < 100 || statusCode > 599){
            throw new AppError(`Invalid status code: ${hitData.statusCode}`, 400)
        }

        const latencyMs = parseFloat(hitData.latencyMs)
        if(isNaN(latencyMs) || latencyMs < 0){
            throw new AppError(`Invalid latency: ${hitData.latencyMs}`, 400)
        }

        return true
    }

    ingestApiHit = async (hitData) => {
        try {
            this.validateHitData(hitData)
            const { serviceName, endpoint, method, statusCode, latencyMs, clientId, apiKeyId, ip = null, userAgent = '' } = hitData

            const eventPayload = {
                eventId: uuidv4(),
                timestamp: new Date(),
                serviceName,
                endpoint,
                method: method.toUpperCase(),
                statusCode: parseInt(statusCode, 10),
                latencyMs: parseFloat(latencyMs),
                clientId,
                apiKeyId,
                ip,
                userAgent
            }

            await this.eventProducer.publishApiHit(eventPayload)
            
            logger.info('API hit published', {
                eventId: eventPayload.eventId,
                endpoint: eventPayload.endpoint,
                method: eventPayload.method,
                clientId: eventPayload.clientId
            })

            return {
                eventId: eventPayload.eventId,
                status: 'queued',
                timestamp: eventPayload.timestamp,
                
            }
        } catch (error) {
            throw error
        }
    }
}

export default IngestService