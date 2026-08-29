const RETRYABLE_PATTERNS = [
    'channel closed',
    'connection closed',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'buffer full',
    'heartbeat timeout',
    'not available',
    'server connection closed'
];

export const isRetryable = (err) => {
    if(!err) return false

    const msg = (err.message || '').toLowerCase()
    const status_code = (err.code || '').toUpperCase()

    if(status_code === 'ENOTFOUND') return true

    return RETRYABLE_PATTERNS.some(
        (pattern) => msg.includes(pattern.toLowerCase()) || status_code.includes(pattern.toLowerCase()))

    
}

export class RetryStrategy{
    constructor(opts={}){
        this.maxRetries = opts.maxRetries || 3,
        this.baseDelayMs = opts.baseDelayMs || 200,
        this.maxDelayMs = opts.maxDelayMs || 500,
        this.jitterFactor = opts.jitterFactor || 0.3
    }
    shouldRetry = (attempt) => {
        return attempt < this.maxRetries
    }

    delay = (attempt) => {
        const exponential = this.baseDelayMs * Math.pow(2, attempt)
        const capped = Math.min(exponential, this.maxDelayMs)

        const jitter = capped * (Math.random() - 0.5) * 2 * this.jitterFactor;
        return Math.max(0, Math.floor(capped + jitter));
    }

    wait = (attempt) => {
        const ms = this.delay(attempt)
        return new Promise((resolve) => setTimeout(resolve, ms))
    }
}

