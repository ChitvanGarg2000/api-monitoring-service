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

  async findByUsername(username) {
    throw new Error('Method not implemented')
  }

  async findAll() {
    throw new Error('Method not implemented')
  }

  async update(clientId, updateClientData) {
    throw new Error('Method not implemented')
  }

  async delete(clientId) {
    throw new Error('Method not implemented')
  }
}

export default BaseClientRepository