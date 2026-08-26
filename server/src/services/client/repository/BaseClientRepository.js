class BaseClientRepository {
  constructor(clientModel) {
    this.model = clientModel
  }

  async create(clientData) {
    throw new Error('Method not implemented')
  }

  async findById(id) {
    throw new Error('Method not implemented')
  }

  async findByEmail(email) {
    throw new Error('Method not implemented')
  }

  async findBySlug(slug) {
    throw new Error('Method not implemented')
  }

  async findAll(filter = {}, options = {}) {
    throw new Error('Method not implemented')
  }

  async count(filter = {}) {
    throw new Error('Method not implemented')
  }
 
}

export default BaseClientRepository