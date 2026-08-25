import jwt from "jsonwebtoken";
import ResponseFormatter from "../shared/utils/responseFormatter.js";
import config from "../shared/config/index.js";
import logger from "../shared/config/logger.js";

const authenticate = async (req, res, next) => {
    try {
        let token = null;
        
        if(req.cookies && req.cookies.authToken){
            token = req.cookies.authToken
        }

        if(!token){
            return res.status(401).json(ResponseFormatter.error('Authentication token not provided', 401))
        }

        try {
            const decodedToken = jwt.verify(token, config.jwt.secret)
            req.user = decodedToken
            next()
        } catch (error) {
            return res.status(401).json(ResponseFormatter.error('Authentication token not valid', 401))
        }
    } catch (error) {
        logger.error('Error during authentication: ', error)
        next(error)
    }
}

export default authenticate