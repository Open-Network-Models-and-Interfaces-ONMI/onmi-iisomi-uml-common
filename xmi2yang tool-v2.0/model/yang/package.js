/**
 * Created by Lenovo on 2016/6/18.
 */
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
function Package(name, id, path, comment, fileName) {
    this.name = name;
    this.id = id;
    this.path = path;
    this.description = comment;
    this.fileName = fileName;
    this.children = [];
    this.uses = [];
}
Package.prototype.writeNode = function (layer) {
    if(this.children.length == 0){
        return "";
    }
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }

    var name = "container " + this.name;
    var descript;
    if(!this.description){
        this.description = "none";
    }
    if (typeof this.description == 'string') {
        this.description = this.description.replace(/\r+\n\s*/g, '\r\n' + PRE + '\t\t');
        this.description = this.description.replace(/\"/g,"\'");
    }
    this.description ? descript = PRE + "\tdescription \"" + this.description + "\";\r\n" : descript = "";
    var children = "";
    if (this.children) {
        for (var i = 0; i < this.children.length; i++) {
            children += this.children[i].writeNode(layer + 1);
        }
    }
    var uses = "";
    for(var i = 0; i < this.uses.length; i++){
        uses += PRE + "\tuses " + this.uses[i].name + ";\r\n";
    }
    //uses = uses.replace(/\r\n$/g, "");
    var s = PRE + name + " {\r\n" +
        children +
        uses +
        descript +
        PRE + "}\r\n";
    return s;
};
module.exports = Package;
