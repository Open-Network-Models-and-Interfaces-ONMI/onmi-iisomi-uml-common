/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\yang\uses.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
function uses(name,feature){
    this.name=name;
    this.description;
    this.refine;
    this["if-feature"]=feature;

}
uses.prototype.writeNode=function(layer){
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }
    var name="uses "+this.name;
    var descript="";
    if (typeof this.description == 'string') {
        this.description = this.description.replace(/\r+\n+/g, '\r\n' + PRE + '\t\t');
        descript = PRE + "\tdescription \"" + this.description + "\";\r\n"
    }
    var feature="";
    if(this["if-feature"]){
        feature = PRE + "\tif-feature " + this["if-feature"] + ";\r\n";
    }
    var s = PRE + name + " {\r\n" +
        descript +
        feature+
        PRE + "}\r\n";
    return s;
};

module.exports=uses;