class BaseRepository {
    constructor(model){
        this.model = model
    }

    async create(data){
        throw new Error('Method not implemented')
    }

    async findById(data){
        throw new Error('Method not implemented')
    }

    async findByUsername(data){
        throw new Error('Method not implemented')
    }

    async findByEmail(data){
        throw new Error('Method not implemented')
    }

    async findAll(data){
        throw new Error('Method not implemented')
    }

}

export default BaseRepository