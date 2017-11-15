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
var Type = require("./yang/type.js");
var Attribute = require("./OwnedAttribute.js");
var Node = require('./yang/node.js');

function Class(name, id, type, comment, nodeType, path, config, isOrdered, fileName){
    this.name = name;
    this.id = id;
    this.type = type;
    this.path = path;
    this.nodeType = nodeType;
    this.description = comment;
    this.Gname;
    this.support;
    this.status;
    this.generalization = [];
    this.instancePath = "";
    this.instancePathFlag;
    this.isGrouping = false;
    this.isAbstract = false;//"class" is abstract
    this.isLeaf = false;
    this.config = config;
    this.isOrdered = isOrdered;
    this.fileName = fileName;
    this.association;
    this.attribute = [];
    this.key = [];
    this.keyid = [];
    this.keyvalue=[];
    
}
Class.prototype.isEnum = function(){
    var result;
    this.type == "Enumeration" ? result = true : result = false;
    return result;
};
Class.prototype.buildEnum = function(obj) {
    var node = new Type("enumeration");
    node.fileName = this.fileName;
    var literal = obj["ownedLiteral"];
    var enumComment;
    var enumValue;
    var enumNode;
    if(literal == undefined){
        return;
    }
    if (literal.array != undefined) {
        // More than one enumerated value
        for (var i = 0; i < literal.array.length; i++) {
            enumValue = literal.array[i].attributes().name;
            //enumValue = "enum " + literal.array[i].attributes().name;
            enumComment = "";
            if(literal.array[i]["ownedComment"]){
                if (literal.array[i]["ownedComment"].array) {
                    enumComment = literal.array[i]["ownedComment"].array[0].body.text();
                    for (var j = 1; j < literal.array[i]["ownedComment"].array.length; j++) {
                        enumComment += "\r\n" + literal.array[i]["ownedComment"].array[j].body.text();
                    }
                } else {
                    enumComment = literal.array[i]["ownedComment"].body.text();
                }
            }
            enumValue = enumValue.replace(/[^\w\.-]+/g, '_');
            enumNode = new Node(enumValue, enumComment, "enum");
            enumNode.fileName = this.fileName;
            node.children.push(enumNode);
        }
    } else {
        // Single enumerated value
        //node.children.push("enum " + literal.attributes().name);
        enumValue = literal.attributes().name;
        //enumValue = "enum " + literal.array[i].attributes().name;
        if(literal["ownedComment"]){
            enumComment = "";
            if (literal["ownedComment"].array) {
                for (var j = 0; j < literal["ownedComment"].array.length; j++) {
                    if(literal["ownedComment"].array[j].hasOwnProperty("body") && literal["ownedComment"].array[j].body.hasOwnProperty("text")){
                        enumComment += literal["ownedComment"].array[j].body.text() + "\r\n";
                    }
                }
                enumComment = enumComment.replace(/\r\n$/g, "");
            } else if(literal["ownedComment"].hasOwnProperty("body") && literal["ownedComment"].body.hasOwnProperty("text")){
                enumComment = literal["ownedComment"].body.text();
            }else{
                console.log("The comment of xmi:id=\"" + literal.attributes()["xmi:id"] + "\" is undefined!");
            }
        }
        enumValue = enumValue.replace(/[^\w\.-]+/g,'_');
        enumNode = new Node(enumValue, enumComment, "enum");
        enumNode.fileName = this.fileName;
        node.children.push(enumNode);
    }
    this.attribute.push(node);
/*    function pushEnumComment(enumComment) {
        var comment = [];
        enumComment = enumComment.replace(/\r\s*!/g,'\r');
        comment = enumComment.split('\r');
        node.children.push(comment[0]);
        for (var i = 1; i < comment.length; i++) {
            node.children.push("\t\t" + comment[i]);
        }
        console.log("d");
    }*/
};

Class.prototype.buildIdentityref = function(obj) {
    var node = new Type("identityref");
    node.fileName = this.fileName;
    var name=this.name.replace(/-t$/g,"");
    var INode = new Node(name,undefined, "base");
    INode.fileName = this.fileName;
    node.children.push(INode);

    this.attribute.push(node);

};

Class.prototype.buildAttribute = function(att){
    var id = att.attributes()['xmi:id'];
    var name;
    att.attributes().name ? name = att.attributes().name : console.log("ERROR:The attribute 'name' of tag 'xmi:id=" + att.attributes()["xmi:id"] + "' in this file is empty!");
    if(name){
        name=name.replace(/^[^A-Za-z|_]+|[^A-Za-z|_\d]+$/g, "");
        name=name.replace(/[^\w\.-]+/g, '_');
    }
    var comment = "";
    if(att['ownedComment']){
        if(att['ownedComment'].array){
            for(var i = 0; i < att['ownedComment'].array.length; i++){
                if(att['ownedComment'].array[i].hasOwnProperty("body") && att['ownedComment'].array[i].body.hasOwnProperty("text")){
                    comment += att['ownedComment'].array[i].body.text() + "\r\n";
                }
            }
            comment = comment.replace(/\r\n$/g, "");
        }else if(att['ownedComment'].hasOwnProperty("body") && att['ownedComment'].body.hasOwnProperty("text")){
            comment = att['ownedComment'].body.text();
        }else{
            console.log("The comment of xmi:id=\"" + att.attributes()["xmi:id"] + "\" is undefined!");

        }
    }
    var association;
    att.attributes().association ? association = att.attributes().association : association = null;
    var isReadOnly;
    att.attributes().isReadOnly ? isReadOnly = att.attributes().isReadOnly : isReadOnly = false;
    var isOrdered;
    att.attributes().isOrdered ? isOrdered = att.attributes().isOrdered : isOrdered = false;
    var type;
    var isLeaf;
    if(att.attributes().type){
        type = att.attributes().type;
        isLeaf = false;
    }
    else if(att['type']){
        type = att['type'].attributes();
        if (type['xmi:type'] == 'uml:PrimitiveType') {
            type = type.href.split('#')[1].toLocaleLowerCase() ;
            isLeaf = true;
        }else if(type['xmi:type'] == "uml:Class" || type['xmi:type'] == "uml:DataType" || type['xmi:type'] == "uml:Enumeration" || type['xmi:type'] == "uml:Signal"){
            type = type.href.split('#')[1];
            isLeaf = false;
        }
        else {
            type = type.href;
        }
    }
    else{
        console.warn("Warning:The type of attribute xmi:id=\"" + id + "\" is undefined!" + this.fileName + " " + name);
        type = "string";
        isLeaf = true;
    }
    var attribute = new Attribute(id, name, type, comment, association, isReadOnly, isOrdered, this.fileName);//build a attribute
    if(att.attributes().aggregation && att.attributes().aggregation == "composite"){
        attribute.isleafRef = false;
    }
    attribute.giveValue(att);
    attribute.giveNodeType(isLeaf);
    this.attribute.push(attribute);
    var r = attribute.returnType();
    return r;
};
Class.prototype.buildGeneral = function(gen){
    var obj;
    if(gen.attributes().general){
        obj = gen.attributes().general;
    }else{
        obj = gen.general.attributes().href.split("#")[1];
    }
    this.generalization.push(obj);
};
Class.prototype.buildOperate = function(para){
    var arr = [];
    var type;
    var isLeaf;
    var nodeType;
    var id;
    var input = [];
    var output = [];
    var id = para.attributes()['xmi:id'];
    var name = para.attributes().name;
    if(para.attributes().type){
        type = para.attributes().type;
        isLeaf = false;
    }else if(para['type']){
        type = para['type'].attributes();
        if (type['xmi:type'] == 'uml:PrimitiveType') {
            isLeaf = true;
            type = type.href.split('#')[1].toLocaleLowerCase() ;
        } else  if (type['xmi:type'] == 'uml:Class') {
            isLeaf = false;
            type = type.href.split('#')[1] ;
        }
        else {
            isLeaf = true;
            type = type.href;
        }
    }
    else{
        type = "string";
        isLeaf = true;
    }
    var comment = "";
    //para['ownedComment'] ? comment = att['ownedComment'].body.text() : comment = null;
    if(para["ownedComment"]){
        if(para['ownedComment'].array){
            for(var i = 0; i < para['ownedComment'].array.length; i++){
                if(para['ownedComment'].array[i].hasOwnProperty("body") && para['ownedComment'].array[i].body.hasOwnProperty("text")){
                    comment += para['ownedComment'].array[i].body.text() + "\r\n";
                }
            }
            comment = comment.replace(/\r\n$/g, "");
        }else if(para['ownedComment'].hasOwnProperty("body") && para['ownedComment'].body.hasOwnProperty("text")){
            comment = para['ownedComment'].body.text();
        }else{
            console.log("The comment of xmi:id=\"" + para.attributes()["xmi:id"] + "\" is undefined!");
        }
    }
    var association;
    para.attributes().association ? association = para.attributes().association : association=null;
    var isReadOnly;
    para.attributes().isReadOnly ? isReadOnly = para.attributes().isReadOnly : isReadOnly = false;
    var isOrdered;
    para.attributes().isOrdered ? isOrdered =para.attributes().isOrdered : isOrdered = false;
    var parameter = new Attribute(id, name, type, comment, association, isReadOnly, isOrdered, this.fileName);
    parameter.giveValue(para);
    parameter.giveNodeType(isLeaf);
    var r = parameter.returnType();
    if(para.attributes().direction == "out"){
        parameter.rpcType = "output";
    }else{
        parameter.rpcType = "input";
    }
    this.attribute.push(parameter);
    return r;
};
module.exports = Class;
