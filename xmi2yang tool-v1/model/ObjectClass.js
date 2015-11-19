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
    this.notGrouping=true;
    this.isAbstract=false;
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
    return node;
};
Class.prototype.buildAttribute=function(attri){
    var arr=[];
    var obj;
    var len;
    var i=0;
    attri.array? len=attri.array.length:len=1;
    for (; i < len; i++) {
        len == 1 ? obj = attri : obj = attri.array[i];
        var id = obj.attributes()['xmi:id'];
        var name = obj.attributes().name;
        var comment;
        obj['ownedComment'] ? comment = obj['ownedComment'].body.text() : comment = null;
        var association;
        obj.attributes().association ? association = obj.attributes().association : association=null;
        var isReadOnly;
        obj.attributes().isReadOnly ? isReadOnly =obj.attributes().isReadOnly : isReadOnly = false;
        var type;
        var isLeaf;
        if(obj.attributes().type){
            type = obj.attributes().type;
            isLeaf=false;
        }
        else if(obj['type']){
            type =obj['type'].attributes();
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
        var attribute=new Attribute(id, name,type, comment, association, isReadOnly);
        if(obj.attributes().aggregation&&obj.attributes().aggregation=="composite"){
            attribute.isleafRef=false;
        }
        //.path=this.path+"-"+this.name+"-"+name;
        attribute.giveValue(obj);
        attribute.giveNodeType(isLeaf);
        var r=attribute.returnType();
        if(r!==undefined){
            arr.push(r);
        }
        this.attribute.push(attribute);
    }
    return arr;
};
Class.prototype.buildGeneral=function(gener){
    var len;
    if(gener!=null) {
        gener.array ? len = gener.array.length : len = 1;
        for (var i = 0; i < len; i++) {
            var obj;
            if(len == 1){
                if(gener.attributes().general){
                    obj = gener.attributes().general;
                }else{
                    obj = gener.general.attributes().href.split("#")[1];
                }

            }else{
                if(gener.array[i].attributes().general){
                    obj = gener.array[i].attributes().general;
                }else{
                    obj = gener.array[i].general.attributes().href.split("#")[1];
                }

            }
            this.generalization.push(obj);
        }
    }
    return this.generalization;
};
Class.prototype.buildOperate=function(param){
    var arr=[];
    var obj;
    var len;
    var type;
    var isLeaf;
    var nodeType;
    var id;
    var input=[];
    var output=[];
    param.array? len=param.array.length:len=1;
    for (var i=0; i < len; i++) {
        len==1? obj =param:obj=param.array[i];
        var id = obj.attributes()['xmi:id'];
        var name = obj.attributes().name;
        if(obj.attributes().type){
            type = obj.attributes().type;
            isLeaf=false;
        }else if(obj['type']){
            type =obj['type'].attributes();
            isLeaf=true;
            if (type['xmi:type'] == 'uml:PrimitiveType') {
                type =type.href.split('#')[1].toLocaleLowerCase() ;
            } else {
                type = type.href;
            }
        }
        else{
            type=null;
            isLeaf=true;
        }
        id=obj.attributes()["xmi:id"];
        var parameter=new Attribute(id, name,type);
        parameter.giveValue(obj);
        parameter.giveNodeType(isLeaf);
        var r=parameter.returnType();
        if(r!==undefined){
            arr.push(r);
        }
        if(obj.attributes().direction=="out"){
            parameter.rpcType="output";
        }else{
            parameter.rpcType="input";
        }
        this.attribute.push(parameter);
    }
    return arr;
};
module.exports=Class;
