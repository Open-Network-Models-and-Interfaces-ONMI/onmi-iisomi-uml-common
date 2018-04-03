/**
 * Created by Lenovo on 2016/5/7.
 */

function Realization(id, clientid, supplierid, clientFile, supplierFile, comment, fileName) {
    this.id = id;
    this.clientid = clientid;
    this.supplierid = supplierid;
    this.clientFile = clientFile;
    this.supplierFile = supplierFile;
    this.description = comment;
    this.fileName = fileName;
}
module.exports = Realization;