/**
 * Created by Lenovo on 2016/6/6.
 */
var client = require("./Association.js"),
    supplier = require("./Association.js");


function AssociationCompare(client, supplier) {
    this.client = client;
    this.supplier = supplier;
}
module.exports = AssociationCompare;