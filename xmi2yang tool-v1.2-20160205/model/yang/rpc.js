/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.04 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\yang\rpc.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
var leaf = require('./leaf.js');
var leaf_list = require('./leaf-list.js');
var Node = require('./node.js');

function rpc(name, descrip,feature,status) {
    this.name = name;
    this.description = descrip;
    this["if-feature"]=feature;
    this.status=status;
    this.output = [];
    this.input = [];
}
rpc.prototype.buildChild = function (att, type, rpcType) {
    if(type=="leaf"||type=="leaf-list"){
        //translate the "integer" to "uint32"
        switch(att.type){
            case "integer":att.type="uint64";
                break;
            default:break;
        }
    }
    var obj;
    //create a subnode by "type"
    switch (type) {
        case "leaf":
            obj = new leaf(att.name, att.id, att.config, att.defaultValue, att.description, att.type,att.support,att.status);
            break;
        case "enumeration":
            obj = new leaf(att.name, att.id, att.config, att.defaultValue, att.description, att,att.support,att.status);
            break;
        case "leaf-list":
            obj = new leaf_list(att.name, att.id, att.config, att.description, att['max-elements'], att['min-elements'], att.type,att.isOrdered,att.support,att.status);
            break;
        case "list":
            obj = new Node(att.name, att.description, att.nodeType, att['max-elements'], att['min-elements'], att.id,att.config,att.isOrdered,att.support,att.status);
            if (att.isUses) {
                if (att.config) {
                    if (att.key) {
                        obj.key = att.key;
                    } else {
                        //obj.key="localId";
                    }
                }
                obj.isGrouping=att.isGrouping;
                obj.buildUses(att);
            }
            break;
        case "container":
            obj = new Node(att.name, att.description, att.nodeType, att['max-elements'], att['min-elements'], att.id, att.config,att.support,att.status);
            if (att.isUses) {
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

    var name = "rpc " + this.name;
    var descript;
    var op = "";
    var ip = "";
    if (typeof this.description == 'string') {
        this.description = this.description.replace(/\r\r\n\s*/g, '\r\n' + PRE + '\t\t');
    }
    this.description ? descript = PRE + "\tdescription \"" + this.description + "\";\r\n" : descript = "";
    var feature="";
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
        for (var i = 0; i < this.input.length; i++) {
            ip += this.input[i].writeNode(layer + 2);
        }
        ip += PRE + "\t}\r\n";
    }
    var s = PRE + name + " {\r\n" +
        descript +
        feature+
        ip+
        op+ PRE + "}\r\n";
    return s;
};

module.exports = rpc;
