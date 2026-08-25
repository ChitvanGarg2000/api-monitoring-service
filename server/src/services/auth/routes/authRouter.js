import express from 'express'
import dependencies from "../Dependencies/dependencies.js"
import authenticate from '../../../middlewares/authenticate.js'
import validate from '../../../middlewares/validate.js'
import requestLogger from '../../../middlewares/requestLogger.js'
import authorize from '../../../middlewares/authorize.js'
import { onboardSuperAdminSchema, registrationSchema, loginSchema } from '../validation/authSchema.js'
import { APPLICATION_ROLES } from '../../../shared/constants/role.js'

const router = express.Router()
const { controllers } = dependencies
const authController = controllers.authController

router.post('/login', requestLogger, validate(loginSchema), authController.login)
router.post('/register', requestLogger, authenticate, authorize([APPLICATION_ROLES.SUPER_ADMIN]), authController.register)
router.post('/onboard-super-admin', requestLogger, validate(onboardSuperAdminSchema), authController.onboardSuperAdmin)
router.get('/get-profile', requestLogger, authenticate, authController.getProfile)
router.post('/logout', requestLogger, authenticate, authController.logout)



export default router