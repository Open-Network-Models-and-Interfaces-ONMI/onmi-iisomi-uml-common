/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.04 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\yang\module.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
function Module(name, namespace, imp, pref, org, contact, revis, descrp) {
    this.name = name;
    this.namespace = namespace;
    this.import = [];
    this.prefix = pref;
    this.organization = org;
    this.contact = contact;
    this.revision = revis;
    this.description = descrp;
    this.children = [];

}
Module.prototype.writeNode = function (layer) {
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }
    var name = "module " + this.name;
    var namespace;
    this.namespace == "" || this.namespace == undefined ? namespace = PRE + "\tnamespace ;\r\n" : namespace = PRE + "\tnamespace " + this.namespace + ";\r\n";
    var imp = "";
    if (this.import == [] || this.import == undefined) {
        imp = ""
    } else {
        for (var i = 0; i < this.import.length; i++) {
            imp += PRE + "\timport " + this.import[i] + " {\r\n" + PRE + "\t\tprefix " + this.import[i] + ";\r\n" + PRE + "\t}\r\n";
        }
    }
    var pref;
    this.prefix == "" || this.prefix == undefined ? pref = PRE + "\tprefix ;\r\n" : pref = PRE + "\tprefix " + this.prefix + ";\r\n";
    var org;
    this.organization == "" || this.organization == undefined ? org = "" : org = PRE + "\torganization " + this.organization + ";\r\n";
    var contact;
    this.contact == "" || this.contact == undefined ? contact = "" : contact = PRE + "\tcontact " + this.contact + ";\r\n";
    var revis;
    //var date=new Date();
    Date.prototype.Format = function (fmt) { //author: meizz 
        var o = {
            "M+": this.getMonth() + 1, 
            "d+": this.getDate(), 
            "h+": this.getHours(), 
            "m+": this.getMinutes(), 
            "s+": this.getSeconds(), 
            "q+": Math.floor((this.getMonth() + 3) / 3), 
            "S": this.getMilliseconds()
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    }
    revis = new Date().Format("yyyy-MM-dd");
    //revis=date.toLocaleDateString();
    this.revision !== "" && this.revision !== undefined ?  revis = PRE + "\trevision " + this.revision + "{}\r\n":revis =  PRE + "\trevision " + revis + "{}\r\n" ;
    var descrp;
    if (typeof this.description == 'string') {
        this.description = this.description.replace(/\r\r\n\s*/g, '\r\n' + PRE + '\t\t');
    }
    this.description == "" || this.description == undefined ? descrp = "" : descrp = PRE + "\tdescription \"" + this.description + "\";\r\n";
    var st = "";
    if (this.children) {
        for (var i = 0; i < this.children.length; i++) {
            st += this.children[i].writeNode(layer + 1);
        }
    }
    st = PRE + name + " {\r\n" +
    namespace +
    pref +
    imp +
    org +
    descrp +
    contact +
    revis +
    st + "}\r\n";
    return st;
};
module.exports = Module;
