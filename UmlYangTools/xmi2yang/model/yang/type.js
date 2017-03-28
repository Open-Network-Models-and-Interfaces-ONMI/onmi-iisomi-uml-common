/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\yang\type.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/

var Util = require('./util.js');

function type(name, id, path, range, length, descrip, fileName) {
    this.name = name;
    this.id = id;
    this.description = descrip;
    this.path = path;
    this.range = range;
    this.length = length;
    this.children = [];
    this.fileName = fileName;
    if (this.name === 'integer') { this.name = 'uint64'; }
}
type.prototype.writeNode = function (layer) {
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }
    if(parseInt(this.name[0]) != -1 && parseInt(this.name[0]) >= 0){
        var first = this.name[0];
        switch (first){
            case '0' :
                this.name = this.name.replace(/^0/g, "Zero");
                break;
            case '1' :
                this.name = this.name.replace(/^1/g, "One");
                break;
            case '2' :
                this.name = this.name.replace(/^2/g, "Two");
                break;
            case '3' :
                this.name = this.name.replace(/^3/g, "Three");
                break;
            case '4' :
                this.name = this.name.replace(/^4/g, "Four");
                break;
            case '5' :
                this.name = this.name.replace(/^5/g, "Five");
                break;
            case '6' :
                this.name = this.name.replace(/^6/g, "Six");
                break;
            case '7' :
                this.name = this.name.replace(/^7/g, "Seven");
                break;
            case '8' :
                this.name = this.name.replace(/^8/g, "Eight");
                break;
            case '9' :
                this.name = this.name.replace(/^9/g, "Nine");
                break;
        }
    }
    var name = "type " + this.name;
   /* if (this.name !== "enumeration") {
        name += ";";
    }*/
    var s = "";
    if(this.path || this.range || this.length || this.children.length){
        s = " {\r\n";
        var regex  = /[^0-9/./*]/;
        if(this.range){
            /*if(regex.test(this.range) == true){
                if(this.range.indexOf('*') !== -1){
                    this.range = this.range.replace('*', "max");
                }
                this.description = "range " + this.range + "\r\n" + this.description;
                this.description = this.description.replace(/\r\n$/g, "");
                this.range == undefined;
                console.warn("Warning: The range of id = \"" + this.id + "\"doesn't match the RFC 6020! We will put this range into description. Please recheck it.");
            }else{
                this.range = this.range.replace(/\r+\n\s*!/g, '\r\n' + PRE + '\t\t');
                s += PRE + "\trange ";
                s += "\"" + this.range + "\"" + ";\r\n";
            }*/
            s += PRE + "\trange ";
            s += "\"" + this.range + "\"" + ";\r\n";
        }

        if(this.description){
            this.description = this.description.replace(/\r+\n\s*/g, '\r\n' + PRE + '\t\t');
            s += PRE + "\tdescription \"" + this.description + "\";\r\n";
        }
        if (this.children.length) {
            if(typeof this.children[0] == "object"){                //enum
                for(var i = 0; i < this.children.length; i++){
                    s += this.children[i].writeNode(layer + 1);
                }
            }else{
                for (var i = 0; i < this.children.length; i++) {
                    s += PRE + "\t";
                    s += this.children[i] + ";\r\n";
                }
            }
        }
        if(this.path){
            s += PRE + "\t";
            s += Util.yangifyName(this.path) + ";\r\n";
        }

        s = s + PRE + "}";
    }
    else{
        s=";";
    }
    s = PRE + Util.yangifyName(name) + s + "\r\n";
    return s;

};
module.exports = type;
