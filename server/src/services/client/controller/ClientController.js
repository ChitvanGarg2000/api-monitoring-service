import logger from "../../../shared/config/logger.js"
import ResponseFormatter from "../../../shared/utils/responseFormatter.js"

export default class ClientController{
    constructor(clientService, authService){
        if(!clientService || !authService){
            throw new Error('Both client and auth service is required')
        }
        this.clientService = clientService
        this.authService = authService
    }

    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {*} next 
     * @returns {}
     */
    createClient = async (req, res, next) => {
        try {
            console.log(req.user, "<<<< user >>>")
            const isSuperAdmin = await this.authService.checkSuperAdminPermissions(req.user.userId)
            if(!isSuperAdmin) return res.status(403).json(ResponseFormatter.error('Only super admin can create client', 403))
            
            const { body, user } = req
            const client = await this.clientService.createClient(body, user)

            logger.info('create client controller working fine')

            console.log('client', client, '<<<< client >>>>')
            return res.status(201).json(ResponseFormatter.success(client, 'client created successfully', 201))
        } catch (error) {
            logger.error(`error creating client ${error.message}`)
            next(error)
        }
    }


    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {*} next 
     * @returns {}
     */
    createClientUsers = async (req, res, next) => {
        try {
            const { clientId } = req.params

            const user  = await this.clientService.createClientUser(clientId, req.body, req.user)

            logger.info("Client user created successfully")

            return res.status(201).json(ResponseFormatter.success(user, "Client user created successfully", 201))
        } catch (error) {
            logger.error(`error creating client user ${error.message}`)
            next(error)
        }
    }


    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {*} next 
     * @returns {}
     */
    createApiKeys = async (req, res, next) => {
        try {
            const { clientId } = req.params

            const apiKey = await this.clientService.createApiKey(clientId, req.body, req.user)

            return res.status(201).json(ResponseFormatter.success(apiKey, 'api key created successfully'))
        } catch (error) {
            logger.error(`error creating api key`, error)
            next(error)
        }
    }

    /**
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {*} next 
     * @returns {}
     */
    getApiKeys = async (req, res, next) => {
        try {
            const { clientId } = req.params

            if(!clientId) res.status(400).json(ResponseFormatter.error('cliendId required', 400))

            const apiKeys = await this.clientService.getApiKeys(clientId)

            return res.status(200).json(ResponseFormatter.success(apiKeys, "API keys successfully fetched"))
        } catch (error) {
            logger.error('unable to fetch api keys', error)
            next(error)
        }
    }


}