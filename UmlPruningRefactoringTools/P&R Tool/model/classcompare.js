/**
 * Created by Lenovo on 2016/5/7.
 */

var client = require("./ObjectClass.js");
var supplier = require("./ObjectClass.js");

function ClassCompare(client, supplier) {

//function ClassCompare(client, supplier,clientFile, supplierFile) {
    this.client = client;
    this.supplier = supplier;
    //this.clientFile = clientFile;
    //this.supplierFile = supplierFile;

}
module.exports = ClassCompare;