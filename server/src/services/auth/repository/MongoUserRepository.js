import BaseRepository from "./baseRepository.js";
import userModel from "../../../shared/models/User.js";
import logger from "../../../shared/config/logger.js";

class MongoUserRepository extends BaseRepository{
    constructor(){
        super(userModel)
    }

    async create(userData){
        try{
            let data = {...userData}
            if(data.role === 'super_admin' && !data.permissions){
                data.permissions = {
                    canCreateApiKeys: true,
                    canManageUsers: true,
                    canViewAnalytics: true,
                    canExportData: true
                }
            }
            const user = new this.model(data)
            logger.info(`Creating user: ${user.username}`)
            await user.save()
            logger.info(`User created successfully: ${user.username}`)
            return user
        }catch(error){
            logger.error(`Error creating user: ${error.message}`)
            throw error
        }
    }

    async findById(id){
        try {
            const user = await this.model.findById(id)
            logger.info(`User found successfully: ${user.username}`)
            return user
        } catch (error) {
            logger.error(`Error finding user: ${error.message}`)
            throw error
        }
    }

    async findByUsername(username){
        try {
            const user = await this.model.findOne({ username })
            if(!user){
                return null
            }
            logger.info(`User found successfully: ${user.username}`)
            return user
        } catch (error) {
            logger.error(`Error finding user: ${error.message}`)
            throw error
        }
    }

    async findByEmail(email){
        return await this.model.findOne({ email })
    }

    async findAll(){
        return await this.model.find({isActive: true}).select('-password')
    }
}

export default MongoUserRepository