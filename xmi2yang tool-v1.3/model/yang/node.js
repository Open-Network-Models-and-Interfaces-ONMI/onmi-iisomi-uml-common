/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\yang\node.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
var leaf = require('./leaf.js');
var leaf_list = require('./leaf-list.js');
var Type = require('./type.js');

function Node(name, descrip, type, maxEle, minEle, id, config,isOrdered,feature,status) {
    this.id = id;
    this.name = name;
    this.nodeType = type;
    this.key;
    this.description = descrip;
    this.uses = [];
    this.status=status;
    this["max-elements"] = maxEle;
    this["min-elements"] = minEle;
    this.defaultValue;
    this["ordered-by"]=isOrdered;
    this["if-feature"]=feature;
    this.config = config;
    this.isAbstract=false;
    this.isGrouping=false;
    this.children = [];
}

Node.prototype.buildChild = function (att, type) {
    if(type=="leaf"||type=="leaf-list"){
        //translate the "integer" to "uint32"
       var t;
        /*if(typeof att.type=="object"){
            t=att.type.name;
        }else if(typeof type=="string"){
            t=att.type;
        }
        switch(t){
            case "integer":att.type="uint64";
                break;
            default:break;
        }*/

        if(typeof att.type == "object"){
            if(att.type.name == "integer"){
                att.type.name = "uint64";
            }
        }

    }
    var obj;
    //create a subnode by "type"
    switch (type) {
        case "leaf":
            obj = new leaf(att.name, att.id, att.config, att.defaultValue, att.description, att.type,att.support,att.status);
            break;
        case "enumeration":
            obj = new leaf(this.name, att.id, att.config, att.defaultValue, att.description, att,att.support,att.status);
            obj = att;
            break;
        case "leaf-list":
            obj = new leaf_list(att.name, att.id, att.config, att.description, att['max-elements'], att['min-elements'], att.type,att.isOrdered,att.support,att.status);
            break;
        case "list":
            obj = new Node(att.name, att.description, att.nodeType, att['max-elements'], att['min-elements'], att.id, att.config,att.isOrdered,att.support,att.status);
            if (att.isUses) {
                obj.buildUses(att);
                if (att.config) {
                    if (att.key) {
                        obj.key = att.key;
                    } else {
                        //obj.key="localId";
                    }
                }
            }
            obj.isGrouping=att.isGrouping;
            break;
        case "container":
            obj = new Node(att.name, att.description, att.nodeType, att['max-elements'], att['min-elements'], att.id, att.config,att.support,att.status);
            if (att.isUses) {
                obj.buildUses(att);
            }
            break;
        case "typedef":
            //obj = new Type(att.type, att.id,undefined,undefined,undefined, att.description, att.units);
            obj = new Type(att.type, att.id,undefined,att.valueRange,undefined, att.description, att.units);
            break;
        case "enum":
            obj = new Node(this.name, this.description, "enum");
            break;
        default :
            break;
    }
    this.children.push(obj);
};
Node.prototype.buildUses = function (att) {
    this.uses = att.isUses;

};
//create yang element string
Node.prototype.writeNode = function (layer) {
    var PRE = '';
    var k = layer;
    while (k-- > 0) {
        PRE += '\t';
    }
    var status="";
    var descript = "";

    switch (this.status){
        case "Experimental":
        case "Preliminary":
        case "Example":
        case "LikelyToChange":
        case "Faulty":
            if((this.description===undefined)){
                this.description = "Lifecycle : "+this.status;
            }
            else{
                this.description += "\r\n"+"Lifecycle : "+this.status;
            }
            break;
        case "current":
        case "obsolete":
        case "deprecated":
            this.status ? status = PRE + "\tstatus " + this.status + ";\r\n" : status = "";
            break;
        default:
            break;
    }
    //if the nodetype of child node of list is list,then the nodetype of father node change to container
    if(this.nodeType=="list"){
        var temp;
        for(temp=0;temp<this.children.length;temp++){
            if(this.children[temp].nodeType=="list")
                break;
        }
        if(temp<this.children.length)
            this.nodeType="container";
    }
    
    var name = this.nodeType + " " + this.name;

    if ((typeof this.description == 'string')&&(this.description)) {
        this.description = this.description.replace(/\r+\n\s*/g, '\r\n' + PRE + '\t\t');
    }
    this.description ? descript = PRE + "\tdescription \"" + this.description + "\";\r\n" : descript = "";
    var order="";
    /*if(this["ordered-by"]!==undefined&&this.nodeType=="list"){
        if(this["ordered-by"]==true){
            order=PRE+"\tordered-by user"+";\r\n";
        }else{
            order=PRE+"\tordered-by system"+";\r\n";
        }
    }*/
    if(this["ordered-by"] == true && this.nodeType == "list"){
        order = PRE + "\tordered-by user" + ";\r\n";
    }
    
    var maxele;
    var minele;
    var defvalue;
    var conf = "";
    var Key = "";

    if(typeof this.defaultValue == 'number'){
        this.defaultValue ? defvalue = PRE + "\tdefault " + this.defaultValue + ";\r\n" : defvalue = "";
    }else {
        this.defaultValue ? defvalue = PRE + "\tdefault \"" + this.defaultValue + "\";\r\n" : defvalue = "";
    }

    /*if (this.nodeType == "container" && this.config || this.nodeType == "list" && this.config) {
        conf = PRE + "\tconfig " + this.config + ";\r\n";
    } else {
        conf = "";
    }*/
    if((this.nodeType == "container" || this.nodeType == "list")&&(this.config == false)){
        conf = PRE + "\tconfig " + this.config + ";\r\n";
    }

    if (this.nodeType == "list") {
        this["max-elements"] ? maxele = PRE + "\tmax-elements " + this["max-elements"] + ";\r\n" : maxele = "";
        this["min-elements"] ? minele = PRE + "\tmin-elements " + this["min-elements"] + ";\r\n" : minele = "";
        if (this["max-elements"] == "*") {
            maxele = "";
        }
        if (typeof this.key=="string") {
            Key = PRE + "\tkey '" + this.key + "';\r\n";
        }
        //else{
        //    Key = PRE + "\tkey '" + "undefined';\r\n";
        //}
    } else {
        maxele = "";
        minele = "";
    }
    var uses = "";
    if (this.uses instanceof Array) {
        for (var i = 0; i < this.uses.length; i++) {
            if(typeof this.uses[i]=="object"){
                this.uses[i].writeNode(layer+1);
            }else{
                uses += PRE + "\tuses " + this.uses[i] + ";\r\n";
            }
        }
    } else if (typeof this.uses == "string") {
        uses = PRE + "\tuses " + this.uses + ";\r\n";
    }else if(typeof this.uses[i]=="object"){
        this.uses[i].writeNode(layer+1);
    }
    var feature="";
    if(this["if-feature"]&&this.nodeType!=="grouping"){
        feature = PRE + "\tif-feature " + this["if-feature"] + ";\r\n";
    }
    var child = "";
    if (this.children) {
        for (var i = 0; i < this.children.length; i++) {
            child += this.children[i].writeNode(layer + 1);
        }
    }
    var s;
    if(this.nodeType == "enum" && !this.description){
        s = PRE + name + ";\r\n";
    }else{
        s = PRE + name + " {\r\n" +
            descript +
            Key +
            status+
            conf +
            order+
            uses +
            feature+
            child +
            maxele +
            minele +
            defvalue + PRE + "}\r\n";

    }
    return s;
};

module.exports = Node;
