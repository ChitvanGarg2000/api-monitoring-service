import ResponseFormatter from "../shared/utils/responseFormatter.js";
import logger from "../shared/config/logger.js";

const authorize = (allowedRoles=[]) => (req, res, next) => {
    try {
        if(!req.user || !req.user.role){
            return res.status(403).json(ResponseFormatter.error('You are not authorized to access this resource', 403))
        }

        const role = req.user.role

        if(allowedRoles.length > 0 && !allowedRoles.includes(role)){
            return res.status(403).json(ResponseFormatter.error('You are not authorized to access this resource', 403))
        }
        
        next()
    } catch (error) {
        logger.error('Error during authorization: ', error)
        return res.status(500).json(ResponseFormatter.error('Internal server error', 500))
    }
}

export default authorize