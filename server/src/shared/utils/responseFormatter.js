class ResponseFormatter{
    static success(data = null, message="Success", statusCode=200){
        return {
            success: true,
            data,
            message,
            statusCode,
            timestamp: Date.now(),
        }
    }

    static error(message, statusCode=400, error=null){
        return {
            success: false,
            error,
            message,
            statusCode,
            timestamp: Date.now(),
        }
    }
    

    static validationError(errors=null){
        return {
            success: false,
            error: errors,
            message: 'Validation Error',
            statusCode: 400,
            timestamp: Date.now(),
        }
    }

    static paginated(data=null, page, limit, total){
        const totalPages = Math.ceil(total/limit)
        return {
            success: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
            timestamp: Date.now(),
        }
    }
}

export default ResponseFormatter