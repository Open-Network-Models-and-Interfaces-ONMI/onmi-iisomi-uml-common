/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\yang\rpc.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
var leaf = require('./leaf.js');
var leaf_list = require('./leaf-list.js');
var Node = require('./node.js');
var Util = require('./util.js');

function rpc(name, descrip, feature, status, fileName) {
    this.name = name;
    this.description = descrip;
    this["if-feature"] = feature;
    this.status = status;
    this.fileName = fileName;
    this.output = [];
    this.input = [];
}
rpc.prototype.buildChild = function (att, type, rpcType) {
    if(type == "leaf" || type == "leaf-list"){
        //translate the "integer" to "uint32"
        switch(att.type){
            case "integer":
                att.type = "uint64";
                break;
            default:
                break;
        }
    }
    var obj;
    if(att.config){
        att.config = undefined;
    }
    //create a subnode by "type"
    switch (type) {
        case "leaf":
            obj = new leaf(att.name, att.id, att.config, att.defaultValue, att.description, att.type, att.support, att.status, att.fileName);
            break;
        case "enumeration":
            obj = new leaf(att.name, att.id, att.config, att.defaultValue, att.description, att, att.support, att.status, att.fileName);
            break;
        case "leaf-list":
            obj = new leaf_list(att.name, att.id, att.config, att.description, att['max-elements'], att['min-elements'], att.type, att.isOrdered, att.support, att.status, att.fileName);
            break;
        case "list":
            obj = new Node(att.name, att.description, att.nodeType, att['max-elements'], att['min-elements'], att.id, att.config, att.isOrdered, att.support, att.status, att.fileName);
            if (att.isUses) {
                //if (att.config) {
                    if (att.key) {
                        /*if(obj.key.length != 0){
                            console.log("!");
                        }*/
                        obj.key = att.key;
                        obj.keyid = att.keyid;
                    }
                //}
                obj.isGrouping = att.isGrouping;
                obj.buildUses(att);
            }
            break;
        case "container":
            obj = new Node(att.name, att.description, att.nodeType, att['max-elements'], att['min-elements'], att.id, att.config,att.isOrdered, att.support, att.status, att.fileName);
            if (att.isUses){
                obj.buildUses(att);
            }
            break;
        default :
            break;
    }
    if (rpcType == "output") {
        this.output.push(obj);
    } else {
        this.input.push(obj);
    }

};
rpc.prototype.buildUses = function (att) {
    this.uses = att.isUses;

};
rpc.prototype.writeNode = function (layer) {
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }

    var name = "rpc " + Util.yangifyName(this.name);
    var descript;
    var op = "";
    var ip = "";
    var status="";
    switch (this.status){
        case "Experimental":
        case "Preliminary":
        case "Example":
        case "LikelyToChange":
        case "Faulty":
            if((this.description === undefined)){
                this.description = "Lifecycle : " + this.status;
            }
            else{
                this.description += "\r\n"+"Lifecycle : " + this.status;
            }
            break;
        case "current":
        case "obsolete":
        case "deprecated":
            status = this.status ? PRE + "\tstatus " + this.status + ";\r\n" : "";
            break;
        default:
            break;
    }
    if(!this.description){
        this.description = "none";
    }
    if (typeof this.description == 'string') {
        this.description = this.description.replace(/\r\r\n\s*/g, '\r\n' + PRE + '\t\t');
        this.description = this.description.replace(/\"/g, "\'");
    }
    descript = this.description ? PRE + "\tdescription \"" + this.description + "\";\r\n" : "";
    var feature = "";
    if(this["if-feature"]){
        feature = PRE + "\tif-feature " + this["if-feature"] + ";\r\n";
    }
    if (this.output.length > 0) {
        op = PRE + "\toutput {\r\n";
        for (var i = 0; i < this.output.length; i++) {
            op += this.output[i].writeNode(layer + 2);
        }
        op += PRE + "\t}\r\n";
    }
    if (this.input.length > 0) {
        ip = PRE + "\tinput {\r\n";
        this.input.map(function(item) {
            ip += item.writeNode(layer + 2);
        });
        ip += PRE + "\t}\r\n";
    }
    var s = PRE + name + " {\r\n" +
        feature +
        status +
        descript +
        ip+
        op+ PRE + "}\r\n";
    return s;
};

module.exports = rpc;
