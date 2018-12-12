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
function type(name, id, path, range, length, descrip, units, fileName) {
    this.name = name;
    this.id = id;
    this.description = descrip;
    this.path = path;
    this.range = range;
    this.length = length;
    this.children = [];
    this.units = units;
    this.fileName = fileName;
}
type.prototype.writeNode = function (layer) {
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }

    var name = "type " + this.name;
    /* if (this.name !== "enumeration") {
     name += ";";
     }*/
    var s = "";
    if(this.path || this.range || this.length || this.children.length || this.units){
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
            s += this.path + ";\r\n";
        }



        var units;
        if(this.units){
            units = PRE + "\tunits \"" + this.units + "\";\r\n";
        }else{
            units = "";
        }

        s = s +
            units + PRE + "}";
    }
    else{
        s=";";
    }
    //var s = PRE + name + s + "\r\n";
    s = PRE + name + s + "\r\n";
    return s;


};
module.exports = type;