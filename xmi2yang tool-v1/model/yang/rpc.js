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

function rpc(name, descrip) {
    this.name = name;
    this.description = descrip;
    this.output = [];
    this.input = [];
}
rpc.prototype.buildChild = function (att, type, rpcType) {
    var obj;
    switch (type) {
        case "leaf":
            obj = new leaf(att.name, att.id, att.config, att.defaultValue, att.description, att.type);
            break;
        case "enumeration":
            obj = new leaf(att.name, att.id, att.config, att.defaultValue, att.description, att);
            break;
        case "leaf-list":
            obj = new leaf_list(att.name, att.id, att.config, att.description, att['max-elements'], att['min-elements'], att.type);
            break;
        case "list":
            obj = new Node(att.name, att.description, att.nodeType, att['max-elements'], att['min-elements'], att.id);
            if (att.isUses) {
                obj.buildUses(att);
            }
            break;
        case "container":
            obj = new Node(att.name, att.description, att.nodeType, att['max-elements'], att['min-elements'], att.id);
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
    this.description ? descript = PRE + "\tdescription '" + this.description + "';\r\n" : descript = "";
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
        op +
        ip + PRE + "}\r\n";
    return s;
};

module.exports = rpc;
