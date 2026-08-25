import AppError from "../../../shared/utils/AppError.js";
import { APPLICATION_ROLES } from "../../../shared/constants/role.js";
import config from "../../../shared/config/index.js";
import ResponseFormatter from "../../../shared/utils/responseFormatter.js";
import logger from "../../../shared/config/logger.js";

export default class AuthController{
    constructor(authService){
        if(!authService){
            throw new AppError('Auth service is required')
        }
        this.authService = authService
    }

    onboardSuperAdmin = async (req, res, next) => {
        try {
            const {
                email,
                username,
                password
            } = req.body

            const superAdmindata = {
                email,
                username,
                password,
                role: APPLICATION_ROLES.SUPER_ADMIN
            }
            
            const {token, user} = await this.authService.onboardSuperAdmin(superAdmindata)
            res.cookie('authToken', token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                sameSite: config.cookie.sameSite,
                maxAge: config.cookie.maxAge
            })

            res.status(201).json(ResponseFormatter.success(user, 'Super admin onboarded successfully', 201))


        } catch (error) {
            logger.error('Failed to onboard super admin: ', error)
            next(error)
        }
    }

    register = async (req, res, next) => {
        try {
            const {username, email, password, role} = req.body
            const userData = { username, email, password, role: role || APPLICATION_ROLES.CLIENT_VIEWER}

            const { token, user} = await this.authService.register(userData)

            res.cookie('authToken', token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.maxAge
            })

            res.status(201).json(ResponseFormatter.success(user, 'User created successfully', 201))

        } catch (error) {
            logger.error('Failed to create user: ', error)
            next(error)
        }
    }

    login = async (req, res, next) => {
        try {
            const { username, password } = req.body
            const userData = { username, password }
            const { user, token } = await this.authService.login(userData)

            res.cookie('authToken', token, {
                httpOnly: config.cookie.httpOnly,
                secure: config.cookie.secure,
                maxAge: config.cookie.maxAge
            })

            res.status(200).json(ResponseFormatter.success(user, 'User logged in successfully', 200))

        } catch (error) {
            logger.error('Failed to login user: ', error)
            next(error)
        }
    }

    getProfile = async (req, res, next) => {
        try {
            const userId = req.user.userId
            const result = await this.authService.getProfile(userId)

            res.status(200).json(ResponseFormatter.success(result, "Profile accesed successfully!"))
        } catch (error) {
            logger.error('Failed to fetch user profile: ', error)
            next(error)
        }
    } 

    logout = async (req, res, next) => {
        try {
            res.clearCookie('authToken')

            res.status(200).json(ResponseFormatter.success({}, "User logged out successfully", 200))
        } catch (error) {
            logger.error('Failed to logout user: ', error)
            next(error)
        }
    }
}