export class Equipment {
    constructor(id = null, zoneId = null, zoneName = '', name = '', status = '', dataBuy = '') {
        this.id = id;
        this.zoneId = zoneId;
        this.zoneName = zoneName;
        this.name = name;
        this.status = status;
        this.dataBuy = dataBuy;
    }
}