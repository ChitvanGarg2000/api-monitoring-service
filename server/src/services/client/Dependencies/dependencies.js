import ClientController from "../controller/ClientController.js";
import MongoClientRepository from "../repository/ClientRepository.js";
import MongoApiKeyRepository from "../repository/ApiKeyRepository.js";
import MongoUserRepository from "../../auth/repository/MongoUserRepository.js";
import ClientService from "../service/clientService.js";
import AuthContainer from "../../auth/Dependencies/dependencies.js";
class Container {
  static init() {

      const repositories= {
        clientRepository: new MongoClientRepository(),
        apikeyRepository: new MongoApiKeyRepository(),
        userRepository: new MongoUserRepository()
      }
      const services =  {
        clientService: new ClientService(repositories.clientRepository, repositories.apikeyRepository, repositories.userRepository)
      }
      
      const controllers = {
        clientController: new ClientController(services.clientService, AuthContainer.services.authService)
      }

      return { repositories, services, controllers}
  }
}

const clientContainer = Container.init()

export { Container }
export default clientContainer



