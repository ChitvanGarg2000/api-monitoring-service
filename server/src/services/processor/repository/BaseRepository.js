export class BaseRepository{
    constructor({logger: l = console}){
        this.logger = l;
    }

    async save(){
        throw new Error("Not Implemented: save()");
    }

    async count(){
        throw new Error("Not Implemented: count()");
    }

    async find(){
        throw new Error("Not Implemented: find()");
    }

    async deleteOldHits(){
        throw new Error("Not Implemented: deleteOldHits()");
    }
}