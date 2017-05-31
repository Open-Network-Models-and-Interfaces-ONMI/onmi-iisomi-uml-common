/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\yang\leaf.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
var Util = require('./util.js');

function Augment( id,client,  supplier, comment, fileName) {
    this.client = client;
    this.id = id;
    this.supplier =Util.yangifyName(supplier);
    this.description = comment;
    this.fileName = fileName;
}

Augment.prototype.writeNode = function (layer){
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }
    /*if(!this.supplier){
     console.warn("Warning: the default value of xmi:id=" + this.id + " does not exist! Please recheck your uml!");
     return "";
     }*/
    var name;
    name = "augment \"" + this.supplier + "\"";
    var description;
    if(!this.description){
        this.description = "none";
    }
    if (typeof this.description == 'string') {
        this.description = this.description.replace(/\r+\n\s*/g, '\r\n' + PRE + '\t\t');
        this.description = this.description.replace(/\"/g,"\'");
    }
    description = this.description ? PRE + "\tdescription \"" + this.description + "\";\r\n" : "";

    var uses = "";
    if (typeof this.client == "string") {
        if(parseInt(this.client) != -1 && parseInt(this.client) >= 0){
            var first = this.client[0];
            switch (first){
                case '0' :
                    this.client = this.client.replace(/^0/g, "Zero");
                    break;
                case '1' :
                    this.client= this.client.replace(/^1/g, "One");
                    break;
                case '2' :
                    this.client = this.client.replace(/^2/g, "Two");
                    break;
                case '3' :
                    this.client= this.client.replace(/^3/g, "Three");
                    break;
                case '4' :
                    this.client = this.client.replace(/^4/g, "Four");
                    break;
                case '5' :
                    this.client = this.client.replace(/^5/g, "Five");
                    break;
                case '6' :
                    this.client = this.client.replace(/^6/g, "Six");
                    break;
                case '7' :
                    this.client = this.client.replace(/^7/g, "Seven");
                    break;
                case '8' :
                    this.client = this.client.replace(/^8/g, "Eight");
                    break;
                case '9' :
                    this.client = this.client.replace(/^9/g, "Nine");
                    break;
            }
        }
        uses = PRE + "\tuses " + this.client +  "-g;\r\n";
    }

    uses=PRE +"\tuses "+this.client+ "-g;\r\n";

    var s;
    s = PRE + name + " {\r\n" +
        Util.yangifyName(uses) +
        description + "\t}\r\n";
    return s;
};
module.exports = Augment;
