import express from 'express'
import rateLimit from 'express-rate-limit'
import config from '../../../shared/config/index.js';
import validateApiKey from '../../../middlewares/validateApiKey.js';
import ingestContainer from '../Dependencies/Dependencies.js';


const ingestRouter = express.Router()
const ingestLimitter = rateLimit({
    windowMs: config.rateLimit.windowMs, // 15 minutes
    max: config.rateLimit.max, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false
});


ingestRouter.post('/', validateApiKey, ingestLimitter, ingestContainer.ingestController.ingestApiHit)


export default ingestRouter