export class Zone {
    constructor(id = null, userid = null, name = '', description = '', capacity = '', floor = '') {
        this.id = id;
        this.userid = userid;
        this.name = name;
        this.description = description;
        this.capacity = capacity;
        this.floor = floor;
    }
}