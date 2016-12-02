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

function Augment(name, id, uses, usesId, comment, fileName) {
    this.name = name;
    this.id = id;
    this.uses = uses;
    this.usesId = usesId;
    this.description = comment;
    this.fileName = fileName;
}

Augment.prototype.writeNode = function (layer){
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }
    if(!this.name){
        console.warn("Warning: the default value of xmi:id=" + this.id + " does not exist! Please recheck your uml!");
        return "";
    }


    var name;
    name = "augment \"" + this.name + "\"";
    var description;
    if(!this.description){
        this.description = "none";
    }
    if (typeof this.description == 'string') {
        this.description = this.description.replace(/\r+\n\s*/g, '\r\n' + PRE + '\t\t');
        this.description = this.description.replace(/\"/g,"\'");
    }
    this.description ? description = PRE + "\tdescription \"" + this.description + "\";\r\n" : description = "";

    var uses = "";
    if (typeof this.uses == "string") {
        if(parseInt(this.uses[0]) != -1 && parseInt(this.uses[0]) >= 0){
            var first = this.uses[0];
            switch (first){
                case '0' :
                    this.uses = this.uses.replace(/^0/g, "Zero");
                    break;
                case '1' :
                    this.uses = this.uses.replace(/^1/g, "One");
                    break;
                case '2' :
                    this.uses = this.uses.replace(/^2/g, "Two");
                    break;
                case '3' :
                    this.uses = this.uses.replace(/^3/g, "Three");
                    break;
                case '4' :
                    this.uses = this.uses.replace(/^4/g, "Four");
                    break;
                case '5' :
                    this.uses = this.uses.replace(/^5/g, "Five");
                    break;
                case '6' :
                    this.uses = this.uses.replace(/^6/g, "Six");
                    break;
                case '7' :
                    this.uses = this.uses.replace(/^7/g, "Seven");
                    break;
                case '8' :
                    this.uses = this.uses.replace(/^8/g, "Eight");
                    break;
                case '9' :
                    this.uses = this.uses.replace(/^9/g, "Nine");
                    break;
            }
        }
        uses = PRE + "\tuses " + this.uses + ";\r\n";
    }
    var s;
    s = PRE + name + " {\r\n" +
        Util.yangifyName(uses) +
        description + PRE + "}\r\n";
    return s;
}

module.exports = Augment;
