import clientContainer from '../../client/Dependencies/dependencies.js';
import processorContainer from '../../processor/Dependencies/dependency.js';
import authContainer from '../../auth/Dependencies/dependencies.js';
import { AnalyticService } from '../service/analyticService.js';
import { AnalyticController } from '../controller/analyticController.js';

class Container {
    static init() {
        const repositories = {
            clientRepository: clientContainer.repositories.clientRepository,
            metricsRepository: processorContainer.repositories.metricsRepository,
        };

        const analyticService = new AnalyticService(repositories.metricsRepository);

        const services = {
            analyticService,
            authService: authContainer.services?.authService,
        };

        const analyticsController = new AnalyticController({
            analyticService: services.analyticService,
            authService: services.authService,
            clientRepository: repositories.clientRepository,
        });

        const controllers = {
            analyticsController,
        };

        return { repositories, services, controllers };
    }
}

const initialized = Container.init();
export { Container };
export default initialized;
