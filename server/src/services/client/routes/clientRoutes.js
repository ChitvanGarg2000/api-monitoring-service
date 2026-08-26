import express from 'express'
import clientContainer from '../Dependencies/dependencies.js'
import autheticate from '../../../middlewares/authenticate.js'

const clientRouter = express.Router()
const { clientController } = clientContainer.controllers


clientRouter.use(autheticate)

clientRouter.post('/onboard', clientController.createClient)
clientRouter.post('/:clientId/users', clientController.createClientUsers)
clientRouter.post('/:clientId/api-keys', clientController.createApiKeys)
clientRouter.get('/:clientId/get/api-keys', clientController.getApiKeys)

export default clientRouter