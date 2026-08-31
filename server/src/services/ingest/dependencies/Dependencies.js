import IngestService from "../services/ingestService.js"
import { createEventProducer } from "../../../shared/events/producer/createEventProducer.js"
import IngestController from "../controllers/ingestController.js"

class IngestDependencies {
    static init(){
        const eventProducer = createEventProducer()
        const ingestService = new IngestService({ eventProducer })
        const ingestController = new IngestController(ingestService)
        const services = {
            ingestService,
        }
        const controllers = {
            ingestController
        }
        return { services, controllers}
    }
}

const container = IngestDependencies.init()

export default {
    ingestService: container.services.ingestService,
    ingestController: container.controllers.ingestController,
    container
}