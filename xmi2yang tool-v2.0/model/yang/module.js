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
function Module(name, namespace, imp, pref, org, contact, reference, revis, descrp, fileName) {
    this.name = name;
    this.namespace = namespace;
    this.import = [];
    this.prefix = pref;
    this.organization = org;
    this.contact = contact;
    this.reference = reference;
    this.revision = revis;
    this.description = descrp;
    this.fileName = fileName;
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
    this.namespace == "" || this.namespace == undefined ? namespace = PRE + "\tnamespace ;\r\n" : namespace = PRE + "\tnamespace \"" + this.namespace + "\";\r\n";
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
    if(!this.organization){
        this.organization = "ONF (Open Networking Foundation) IMP Working Group";
    }
    org = PRE + "\torganization \"" + this.organization + "\";\r\n";
    var contact = "";
    if(!this.contact){
        this.contact += "WG Web\: <https://www.opennetworking.org/technical-communities/areas/services/>\r\n";
        this.contact += "WG List\: <mailto: <wg list name>@opennetworking.org>\r\n";
        this.contact += "WG Chair: your-WG-chair\r\n";
        this.contact += "\t\t\<mailto:your-WG-chair@example.com>\r\n";
        this.contact += "Editor: your-name\r\n";
        this.contact += "\t\t\<mailto:your-email@example.com>";
    }
    //this.contact == "" || this.contact == undefined ? contact = "" : contact = PRE + "\tcontact \"" + this.contact + "\";\r\n";
    this.contact = this.contact.replace(/\r\n/g, '\r\n' + PRE + '\t\t');
    contact = PRE + "\tcontact \"" + this.contact + "\";\r\n";
    var reference = "";
    if(this.reference){
        this.reference = this.reference.replace(/\r?\n/g, "\r\n\t\t" + PRE);
        reference = PRE + "\treference\r\n";
        reference += PRE + "\t\t\"" +this.reference + "\";\r\n";
    }
    var revis;
    //var date=new Date();
    /*if(this.revision.date == null || this.revision.date == ""){
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
    }else{*/
        revis = this.revision.date;
    //}

    /*if(!this.revision){
        this.revision = "\r\ndescription \"Latest revision\";";
        this.revision += "\r\nreference \"RFC 6020 and RFC 6087\";";
    }else */
    var revision = "";
    if(typeof this.revision == "object"){
        for(var i in this.revision){
            if(i == "date"){
                continue;
            }
            revision += "\r\n" + i + " \"" + this.revision[i] + "\";";
        }
        /*revision += "\r\ndescription \"" + this.revision.description + "\";";
        revision += "\r\nreference \"" + this.revision.reference + "\";";*/
    }
    revision = revision.replace(/\r\n/g, '\r\n' + PRE + '\t\t');
    revis = PRE + "\trevision " + revis + " {" + revision + "\r\n\t" + PRE + "}\r\n";
    //this.revision !== "" && this.revision !== undefined ?  revis = PRE + "\trevision " + this.revision + "{}\r\n":revis =  PRE + "\trevision " + revis + "{}\r\n" ;
    var description;
    if(!this.description){
        this.description = "none";
    }
    if (typeof this.description == 'string') {
        this.description = this.description.replace(/\r+\n\s*/g, '\r\n' + PRE + '\t\t');
        this.description = this.description.replace(/\"/g,"\'");
    }
    description = PRE + "\tdescription \"" + this.description + "\";\r\n";
    var st = "";
    var sub;
    if (this.children) {
        for (var i = 0; i < this.children.length; i++) {
            if(sub != undefined){
                this.children[i - 1] = this.children[i];
            }
            if(this.children[i].name == "Interfaces"){
                sub = this.children[i];
            }
        }
        if(sub != undefined){
            this.children[this.children.length - 1] = sub;
        }
        for (var i = 0; i < this.children.length; i++) {
            st += this.children[i].writeNode(layer + 1);
        }
    }
    st = PRE + name + " {\r\n" +
        namespace +
        pref +
        imp +
        org +
        contact +
        description + 
        reference +
        revis +
        st + "}\r\n";
    return st;
};
module.exports = Module;
