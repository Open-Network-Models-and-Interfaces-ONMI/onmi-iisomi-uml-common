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
var Type = require('./type.js');
function leaf(name, id, config, value, descrip, type, feature, status, fileName) {
    this.name = name;
    this.id = id;
    this.config = config;
    this.status = status;
    this.defaultValue = value;
    this.description = descrip;
    this["if-feature"] = feature;
    this.type = type;
    this.units = this.type.units;
    this.fileName = fileName;
}
leaf.prototype.writeNode = function (layer) {
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }

    var name = "leaf " + this.name;
    var config;
    this.config == false ? config = PRE + "\tconfig false;\r\n" : config = "";
    var descript;
    if(!this.description){
        this.description = "none";
    }
    if (typeof this.description == 'string') {
        this.description = this.description.replace(/\r+\n\s*/g, '\r\n' + PRE + '\t\t');
        this.description = this.description.replace(/\"/g,"\'");
    }
    this.description ? descript = PRE + "\tdescription \"" + this.description + "\";\r\n" : descript = "";
    var feature="";
    if(this["if-feature"]){
        feature = PRE + "\tif-feature " + this["if-feature"] + ";\r\n";
    }
    var status="";
    this.status ? status = PRE + "\tstatus " + this.status + ";\r\n" : status = "";
    
    var defvalue;
    if(typeof this.defaultValue == 'number'){
        this.defaultValue ? defvalue = PRE + "\tdefault " + this.defaultValue + ";\r\n" : defvalue = "";
    }else {
        this.defaultValue ? defvalue = PRE + "\tdefault \"" + this.defaultValue + "\";\r\n" : defvalue = "";
    }
    var type = "";
    if (this.type instanceof Type) {
        type = this.type.writeNode(layer + 1);
    } else if (typeof this.type == "string") {
        if (this.type.split("+")[0] == "leafref") {
            type = PRE + "\ttype leafref {\r\n" + PRE + "\t\t" + this.type.split("+")[1] + ";\r\n" + PRE + "\t}\r\n";
        } else {
            type = PRE + "\ttype " + this.type + ";\r\n";
        }
    } else {
        type = PRE + "\ttype " + "string" + ";\r\n";
    }
    //need delete later
    if(this.type==undefined){
        type="";
    }
    var units;
    if(this.units != undefined && this.units != ""){
        units = PRE + "\tunits \"" + this.units + "\";\r\n";
    }else{
        units = "";
    }
    var s = PRE + name + " {\r\n" +
        feature +
        type +
        units +
        defvalue +
        config +
        status +
        descript + PRE + "}\r\n";
    return s;
};
module.exports = leaf;
