/**
 * Created by Lenovo on 2016/5/16.
 */

var client = require("./OwnedAttribute.js"),
    supplier = require("./OwnedAttribute.js"),
    clientClass = require("./ObjectClass.js"),
    supplierClass = require("./ObjectClass.js");


function AttributeCompare(client, supplier, clientClass, supplierClass) {
    this.client = client;
    this.supplier = supplier;
    this.clientClass = clientClass;
    this.supplierClass = supplierClass;
}
module.exports = AttributeCompare;