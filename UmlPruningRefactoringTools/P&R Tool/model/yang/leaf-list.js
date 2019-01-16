/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\yang\leaf-list.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
var Type = require('./type.js');
function leaf_list(name, id, config, descrip, maxele, minele, type, isOrdered, feature, status, fileName) {
    this.name = name;
    this.id = id;
    this.config = config;
    this.description = descrip;
    this.status = status;
    this["ordered-by"] = isOrdered;
    this["max-elements"] = maxele;
    this["min-elements"] = minele;
    this["if-feature"] = feature;
    this.type = type;
    this.units = this.type.units;
    this.fileName;
}
leaf_list.prototype.writeNode = function (layer) {
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }

    var name = "leaf-list " + this.name;
    var config;
    this.config == false ? config = PRE + "\tconfig false;\r\n" : config = "";
    var descript;
    if (!this.description){
        this.description = "none";
    }
    if (typeof this.description == 'string'){
        this.description = this.description.replace(/\r\r\n\s*/g, '\r\n' + PRE + '\t\t');
        this.description = this.description.replace(/\"/g,"\'");

    }
    this.description ? descript = PRE + "\tdescription \"" + this.description + "\";\r\n" : descript = "";
    var feature = "";
    if(this["if-feature"]){
        feature = PRE + "\tif-feature " + this["if-feature"] + ";\r\n";
    }
    var status = "";
    this.status ? status = PRE + "\tstatus " + this.status + ";\r\n" : status = "";
    var order = "";
    /*if(this["ordered-by"] !== undefined){
        if(this["ordered-by"] == true){
            order = PRE + "\tordered-by user" + ";\r\n";
        }else{
            order = PRE + "\tordered-by system" + ";\r\n";
        }
    }*/
    if(this["ordered-by"] == true && this.nodeType == "list"){
        order = PRE + "\tordered-by user" + ";\r\n";
    }
    var maxele;
    var minele;
    this["max-elements"] ? maxele = PRE + "\tmax-elements " + this["max-elements"] + ";\r\n" : maxele = "";
    this["min-elements"] ? minele = PRE + "\tmin-elements " + this["min-elements"] + ";\r\n" : minele = "";
    if (this["max-elements"] == "*") {
        maxele = "";
    }
    var type;
    this.type ? type = this.type : type = "string";
    if (this.type instanceof Type) {
        type = this.type.writeNode(layer + 1);
    } else if (typeof this.type == "string"){
        if (type.split("+")[0] == "leafref") {
            type = PRE + "\ttype leafref {\r\n" + PRE + "\t\t" + type.split("+")[1] + ";\r\n" + PRE + "\t}\r\n";
        }
        else if(this.type == undefined){
            type = "";
        }
        else {
            type = PRE + '\ttype ' + type + ';\r\n';
        }
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
        config +
        minele +
        maxele +
        order +
        status +
        descript + PRE + "}\r\n";
    return s;
};
module.exports = leaf_list;