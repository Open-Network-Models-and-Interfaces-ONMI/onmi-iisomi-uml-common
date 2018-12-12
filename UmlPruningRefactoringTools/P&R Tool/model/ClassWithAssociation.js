/**
 * Created by Lenovo on 2016/10/25.
 */

var client = require("./Association.js");
var supplier = require("./ObjectClass.js");

function ClassWithAssociation(client, supplier) {

    this.client = client;
    this.supplier = supplier;

}
module.exports = ClassWithAssociation;