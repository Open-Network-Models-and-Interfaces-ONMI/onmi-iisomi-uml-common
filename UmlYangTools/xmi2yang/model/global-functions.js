/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2017 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)) and others. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\global-functions.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/

// just a container for useful javascript extensions and global functions

if (!String.prototype.contains) {
    String.prototype.contains = function(search) {
        return this.indexOf(search) > -1;
    };
}

if (!String.prototype.hasFeatureName) {
  String.prototype.hasFeatureName = function() {
      return this.contains('\r') && !this.split('\r')[0].contains(' ');
  };
}

if (!String.prototype.featureName) {
  String.prototype.featureName = function() {
      if (this.hasFeatureName()) {
          return this.split('\r')[0];
      }
      return this;
  };
}

if (!String.prototype.featureDescription) {
  String.prototype.featureDescription = function() {
      if (this.hasFeatureName()) {
          return this.split('\r').slice(1).join('\r');
      }
      return this;
  };
}





module.exports = {
    version: '2.0'    
};