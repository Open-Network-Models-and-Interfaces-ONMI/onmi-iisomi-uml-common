/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\OpenModelObject.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
function OpenModelObject(id, type, vr, cond, sup, inv, avcNot, dNot, cNot, passBR, opex, opid, ato, key, units, fileName){
    this.id = id;
    this.type = type;
    this.valueRange = vr;
    this.condition = cond;
    this.status = undefined;
    this.support = sup;
    this.isInvariant = inv;
    this.key = key;
    this.attributeValueChangeNotification = avcNot;
    this.objectDeletionNotification = dNot;
    this.objectCreationNotification = cNot;
    this.passedByReference = passBR;
    this["operation exceptions"] = opex;
    this.isOperationIdempotent = opid;
    this.isAtomic = ato;
    this.units = units;
    this.fileName = fileName;
}
module.exports=OpenModelObject;