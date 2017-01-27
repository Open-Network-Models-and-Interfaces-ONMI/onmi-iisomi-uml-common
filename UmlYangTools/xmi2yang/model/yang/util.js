/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\yang\module.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/

exports.yangifyName = function(str) {
    return str
        .replace( /([a-z])([A-Z])/g, '$1-$2' ) // insert dashes
        .toLowerCase()                         // lowercase everything
        .replace( /^_/, '')                    // remove leading underscore
        .replace( /:_/g, ':')                  // and leading underscores in path segments
        .replace( /_/g, '-');                  // convert underscore to dash
};
