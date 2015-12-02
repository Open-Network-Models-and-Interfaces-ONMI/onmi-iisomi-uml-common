/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.04 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \model\ObjectClass.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
var Type=require("./yang/type.js");
var Attribute=require("./OwnedAttribute.js");

function Class(name,id,type,comment,nodeType,path,config){
    this.name=name;
    this.id=id;
    this.type=type;
    this.path=path;
    this.nodeType=nodeType;
    this.description=comment;
    this.generalization=[];
    this.instancePath="";
    this.isGrouping=false;
    this.isAbstract=false;//"class" is abstract
    this.config=config;
    this.association;
    this.attribute=[];
    this.key;
}
Class.prototype.isEnum=function(){
    var result;
    this.type=="Enumeration"?result=true:result=false;
    return result;
};
Class.prototype.buildEnum=function(obj){
    var node=new Type("enumeration");
    var literal=obj["ownedLiteral"];
    for(var i=0;i<literal.array.length;i++){
        node.children.push("enum "+literal.array[i].attributes().name);
    }
    this.attribute.push(node);
};
Class.prototype.buildAttribute=function(att){
    var id = att.attributes()['xmi:id'];
    var name = att.attributes().name;
    var comment;
    att['ownedComment'] ? comment = att['ownedComment'].body.text() : comment = null;
    var association;
    att.attributes().association ? association = att.attributes().association : association=null;
    var isReadOnly;
    att.attributes().isReadOnly ? isReadOnly =att.attributes().isReadOnly : isReadOnly = false;
    var type;
    var isLeaf;
    if(att.attributes().type){
        type = att.attributes().type;
        isLeaf=false;
    }
    else if(att['type']){
        type =att['type'].attributes();
        if (type['xmi:type'] == 'uml:PrimitiveType') {
            type =type.href.split('#')[1].toLocaleLowerCase() ;
            isLeaf=true;
        }else if(type['xmi:type'] =="uml:Class"){
            type =type.href.split('#')[1];
            isLeaf=false;
        }
        else {
            type = type.href;
        }
    }
    else{
        type="string";
        isLeaf=true;
    }
    var attribute=new Attribute(id, name,type, comment, association, isReadOnly);//build a attribute
    if(att.attributes().aggregation&&att.attributes().aggregation=="composite"){
        attribute.isleafRef=false;
    }
    attribute.giveValue(att);
    attribute.giveNodeType(isLeaf);
    this.attribute.push(attribute);
    var r=attribute.returnType();
    return r;
};
Class.prototype.buildGeneral=function(gen){
    var obj;
    if(gen.attributes().general){
        obj = gen.attributes().general;
    }else{
        obj = gen.general.attributes().href.split("#")[1];
    }
    this.generalization.push(obj);
};
Class.prototype.buildOperate=function(para){
    var arr=[];
    var type;
    var isLeaf;
    var nodeType;
    var id;
    var input=[];
    var output=[];
    var id =para.attributes()['xmi:id'];
    var name = para.attributes().name;
    if(para.attributes().type){
        type = para.attributes().type;
        isLeaf=false;
    }else if(para['type']){
        type =para['type'].attributes();
        isLeaf=true;
        if (type['xmi:type'] == 'uml:PrimitiveType') {
            type =type.href.split('#')[1].toLocaleLowerCase() ;
        } else {
            type = type.href;
        }
    }
    else{
        type="string";
        isLeaf=true;
    }
    var parameter=new Attribute(id, name,type);
    parameter.giveValue(para);
    parameter.giveNodeType(isLeaf);
    var r=parameter.returnType();
    if(para.attributes().direction=="out"){
        parameter.rpcType="output";
    }else{
        parameter.rpcType="input";
    }
    this.attribute.push(parameter);
    return r;
};
module.exports=Class;
