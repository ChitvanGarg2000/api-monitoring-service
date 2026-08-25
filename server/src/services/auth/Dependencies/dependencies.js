import AuthController from "../controller/authController.js";
import AuthService from "../service/authService.js";
import MongoUserRepository from "../repository/MongoUserRepository.js";

class Container{
    static init(){
        const repositories = {
            userRepository: new MongoUserRepository()
        }

        const services = { 
            authService: new AuthService(repositories.userRepository)
        }

        const controllers = {
            authController: new AuthController(services.authService)
        }

        return {controllers, services, repositories}
    }
}

const initializedContainer = Container.init()

export { Container }
export default initializedContainer