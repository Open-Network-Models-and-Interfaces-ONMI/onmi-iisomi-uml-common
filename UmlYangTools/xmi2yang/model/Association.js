/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\ObjectClass.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
function association(name, id, nodetype, upperValue, lowerValue,assoid,strictCom,extendedCom){
    this.name = name;
    this.nodeType = nodetype;
    this.id = id;
    this.upperValue = upperValue;
    this.lowerValue = lowerValue;
    this.assoid=assoid;
    this.strictCom=strictCom;
    this.extendedCom=extendedCom;
}
module.exports = association;

