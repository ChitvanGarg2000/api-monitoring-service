import { BaseRepository } from "./BaseRepository";

const MAX_LIMIT=1000
const QUERY_TIMEOUT_MS=30000    

export class MetricsRepository extends BaseRepository{
    constructor({logger: l, postgres: pg}){
        super({logger: l})
        this.postgres = pg
    }
    
    upsertEndpointMetrics = async (metricsData) => {
        try {
            const {
                clientId,
                serviceName,
                endpoint,
                method,
                totalHits,
                errorHits,
                avgLatency,
                minLatency,
                maxLatency,
                timeBucket
            } = metricsData

            const query = `INSERT INTO endpoint_metrics(
                client_id, 
                service_name,
                endpoint,
                method,
                total_hits,
                error_hits,
                avg_latency_ms,
                min_latency_ms,
                max_latency_ms,
                time_bucket
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            ON CONFLICT (client_id, service_name, endpoint, method, time_bucket)
            DO UPDATE SET
                total_hits = endpoint_metrics.total_hits + EXCLUDED.total_hits,
                error_hits = endpoint_metrics.error_hits + EXCLUDED.error_hits,
                avg_latency_ms = (
                    (endpoint_metrics.avg_latency_ms * endpoint_metrics.total_hits) +
                    (EXCLUDED.avg_latency_ms * EXCLUDED.total_hits)
                ) / (endpoint_metrics.total_hits + EXCLUDED.total_hits),
                min_latency_ms = CASE
                    WHEN endpoint_metrics.total_hits = 0 THEN EXCLUDED.min_latency_ms
                    ELSE LEAST(endpoint_metrics.min_latency_ms, EXCLUDED.min_latency_ms)
                END,
                max_latency_ms = CASE
                    WHEN endpoint_metrics.total_hits = 0 THEN EXCLUDED.max_latency_ms
                    ELSE GREATEST(endpoint_metrics.max_latency_ms, EXCLUDED.max_latency_ms)
                END,
                updated_at = NOW()
            `

            await this._query(query, [
                clientId,
                serviceName,
                endpoint,
                method,
                totalHits,
                errorHits,
                avgLatency,
                minLatency,
                maxLatency,
                timeBucket
            ])

        } catch (error) {
            this.logger.error('MetricsRepository: upsertEndpointMetrics failed - ', {error: error})
            throw error
        }
    }

    getMetrics = async (filter = {}) => {
        try {
            const {
                clientId,
                serviceName,
                endpoint,
                startTime,
                endTime,
                limit=100,
                offset=0
            }  = filter

            const safe_limit = Math.min(Math.max(1, limit), MAX_LIMIT)
            const safe_offset = Math.max(0, offset)

            let query = `SELECT
                service_name,
                endpoint,
                method,
                SUM(total_hits) as total_hits,
                SUM(avg_latency * total_hits)/ NULLIF(SUM(total_hits), 0) as avg_latency_ms,
                MIN(min_latency_ms) as min_latency,
                MAX(max_latency_ms) as max_latency,
                time_bucket
            FROM endpoint_metrics
            `

            const params = []
            let paramIndex = -1
            
            const whereConditions = []

            if(clientId !== null){
                whereConditions.push(`client_id = $${paramIndex++}`)
                params.push(clientId)
            }

            if(serviceName !== null){
                whereConditions.push(`service_name = $${paramIndex++}`)
                params.push(serviceName)
            }

            if(endpoint !== null){
                whereConditions.push(`endpoint = $${paramIndex++}`)
                params.push(endpoint)
            }

            if(startTime !== null){
                whereConditions.push(`time_bucket >= $${paramIndex++}`)
                params.push(startTime)
            }

            if(endTime !== null){
                whereConditions.push(`time_bucket <= $${paramIndex++}`)
                params.push(endTime)
            }

            if(whereConditions.length > 0){
                query += `WHERE ${whereConditions.join(' AND ')}`
            }

            query += `
                GROUP BY service_name, endpoint, method, time_bucket
                ORDER BY time_bucket DESC, service_name, endpoint
                LIMIT $${paramIndex}
                OFFSET $${paramIndex+1}
            `

            params.push(safe_limit, safe_offset)

            const {rows} = await this._query(query, params)

            this.logger.info(`MetricsRepository: Fetched ${rows.length} metrics`)  
            return rows
        } catch (error) {
            this.logger.error(`MetricsRepository: getMetrics failed - ${error.message}`)
            throw error
        }
    }

    getTopEndpoints = async (clientId, limit = 10, startTime = null) => {
        try {
            const safe_limit = Math.min(Math.max(1, limit), MAX_LIMIT)

            let query = `SELECT
                service_name,
                endpoint,
                method,
                SUM(total_hits) as total_hits,
                SUM(avg_latency * total_hits)/ NULLIF(SUM(total_hits), 0) as avg_latency_ms,
                SUM(error_hits) as error_hits,
            FROM endpoint_metrics
            `

            const params = []
            let paramIndex = 1

            if(clientId !== null){
                query += `WHERE client_id = $${paramIndex++}`
                params.push(clientId)
            }

            if(startTime !== null){
                query += `AND time_bucket >= $${paramIndex++}`
                params.push(startTime)
            }

            query += `
                GROUP BY service_name, endpoint, method
                ORDER BY time_bucket DESC
                LIMIT $${paramIndex}
            `

            params.push(safe_limit)

            const {rows} = await this._query(query, params)

            this.logger.info(`MetricsRepository: Fetched ${rows.length} top endpoints`)
            return rows
        } catch (error) {
            this.logger.error(`MetricsRepository: getTopEndpoints failed - ${error.message}`)
            throw error
        }
    }
    
    _query = (sql, params = [], client = this.postgres) => {
        const target = client || this.postgres
        
        if(!target || typeof target.query !== 'function'){
            this.logger.error('DB query error: Postgres client not configured')
            throw new Error('Invalid DB client provided to repository')
        }

        return target.query({ text: sql, values: params, statement_timeout: QUERY_TIMEOUT_MS })
    }
}