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
function type(name, id,path,range,length) {
    this.name = name;
    this.id = id;
    this.path=path;
    this.range=range;
    this.length=length;
    this.children = [];
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
    if(this.path|| this.range||this.length||this.children.length){
        s = " {\r\n";
        if (this.children.length) {
            for (var i = 0; i < this.children.length; i++) {
                s += PRE + "\t";
                s += this.children[i] + ";\r\n";
            }
        }
        if(this.path){
            s += PRE + "\t";
            s += this.path + ";\r\n";
        }
        if(this.range){
            s += PRE + "\trange ";
            s += this.range + ";\r\n";
        }
        s=s+PRE + "}";
    }
    else{
        s=";";
    }
    var s = PRE + name + s + "\r\n";
    return s;

};
module.exports = type;