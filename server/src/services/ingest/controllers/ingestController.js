import IngestService from "../services/ingestService.js";
import ResponseFormatter from "../../../shared/utils/responseFormatter.js";

class IngestController{
    constructor(ingestService){
        if(!ingestService) throw new Error('ingestService is required');
        this.ingestService = ingestService
    }

    ingestApiHit = async (req, res)=>{
        try {
            logger.info('Ingest: Client data received', {
                clientId: req.client._id,
                clientName: req.client.name,
                keysInClient: Object.keys(req.client)
            })
                
            const hitData = {
                ...req.body,
                clientId: req.client._id,
                apiKeyId: req.apiKey._id,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'] || ''
            }
            const result = await this.ingestService.ingestApiHit(hitData)
            return res.status(202).json(ResponseFormatter.success(result, 202))
        } catch (error) {
            logger.error('Error ingesting API hit:', error)
            return res.status(500).json(ResponseFormatter.error('Failed to ingest API hit', 500))
        }
    }
}

export default IngestController
