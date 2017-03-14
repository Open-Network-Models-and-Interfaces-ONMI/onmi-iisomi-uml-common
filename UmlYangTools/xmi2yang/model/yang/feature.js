/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\yang\feature.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
require('./util.js');

function feature(id, condition, path, fileName){
    // according to the UML-Yang guideline the "name" is the first line of a "condition" and all
    // other lines are description. Papyrus uses '&#xD;' to indicate a new line;

    var name;        // the name of a yang feature; should be the first line of condition
    var description; // The yang feature description is the condion, exspet the first line
    // var parts = condition.split('\r');
    if (condition.hasFeatureName()) {
      // expected case
      name = condition.featureName();
      description = condition.featureDescription();
    } else {
      // unexpected case
      name = id;
      description = condition;
      console.warn('The UML input files is not according the UML Guidelines. Please check:', id);
    }
    this.id = id;
    this.name = name;
    this.path = path;
    this.description = description;
    this.fileName = fileName;
    this.status = undefined;
    this.reference = undefined;
}
feature.prototype.writeNode = function(layer){
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }
    var name = "feature " + this.name;
    var descript = "";
    if(!this.description){
        this.description = "none";
    }
    if (typeof this.description == 'string') {
        this.description = this.description.replace(/\r+\n+/g, '\r\n' + PRE + '\t\t');
        this.description = this.description.replace(/\"/g, "\'");
        descript = PRE + "\tdescription \"" + this.description + "\";\r\n";
    }
    var s = PRE + name + " {\r\n" +
        descript + PRE + "}\r\n";
    return s;
};
module.exports = feature;
