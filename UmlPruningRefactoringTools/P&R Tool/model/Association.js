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
function association(id, name, memberEnd1, memberEnd2, associationType, type, ownedEndName, upperValue, lowerValue, fileName){
    this.id = id;
    this.name = name;
    this.memberEnd1 = memberEnd1;
    this.memberEnd2 = memberEnd2;
    this.associationType = associationType;                 //choices: 0:noWayNavigableAssociation
                                                            //         1:oneWayNavigableAssociation
                                                            //         2:twoWayNavigableAssociation
    this.type = type;
    this.ownedEndName = ownedEndName;
    this.upperValue = upperValue;
    this.lowerValue = lowerValue;
    this.fileName = fileName;
    this.isInRealization = false;
}
module.exports=association;

