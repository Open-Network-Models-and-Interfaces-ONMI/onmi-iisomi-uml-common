/********************************************************************************************************
* Name: UML to YANG Mapping Tool
* Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
* Licensed under the Apache License, Version 2.0 (the "License").
*
*
* Author: Guoying ZHANG (zhangguoying@catr.cn)
*         Lin JIANG (729570678@qq.com)
*         Hui DING (dinghui@catr.cn)
*
* This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.04 by OpenNetworkFoundation(ONF) IMP group.
*
* file: \main.js
*
* The above copyright information should be included in all distribution, reproduction or derivative works of this software.
*
****************************************************************************************************/
var xmlreader=require('xmlreader'),
    fs=require('fs'),
    CLASS=require('./model/ObjectClass.js'),
    assoc=require('./model/Association.js'),
    Node=require('./model/yang/node.js'),
    Module=require('./model/yang/module.js'),
    RPC=require('./model/yang/rpc.js');

var Typedef=[];//The array of basic DataType and PrimitiveType
var Class=[];//The array of objcet class
var association=[];//The array of xmi:type="uml:Association" of UML
var yang=[];//The array of yang element translated from UML
var Grouping=[];//The array of grouping type
var modName=[];//The array of package name
var yangModule=[];//The array of yang files name
var keylist=[];
var keyId=[];//The array of key
var isInstantiated=[];//The array of case that the class is composited by the other class

function key(id,name){
    this.id=id;//localIdList and uuid 's xmi:id value
    this.name=name;//localIdList and uuid 's name value
}

var result=main_Entrance();

function main_Entrance(){
    try{
        fs.readdir("./project/",function(err,files){
           if(err){
               console.log(err.stack);
               throw err.message;
           } else{
               for(var i=0;i<files.length;i++){
                   if(files[i].split(".")[1]=="xml"){
                       parseModule(files[i]);
                   }
               }
               addKey();//deal with the key for every class
               //if the class's value of aggregation is omposite,the class don't need to be instantiated individually
               for(var i=0;i<Class.length;i++){
                   for(var j=0;j<isInstantiated.length;j++){
                       if(Class[i].id==isInstantiated[j].id){
                           Class[i].isGrouping=true;
                           var path=isInstantiated[j].path+"/"+Class[i].key;
                           Class[i].instancePath=path;
                           break;
                       }
                   }
                   if(j==isInstantiated.length){
                       Class[i].instancePath=Class[i].path+":"+Class[i].name+"/"+Class[i].key;
                   }
               }
               obj2yang(Class);//the function is used to mapping to yang
               // print every yangModules whose children attribute is not empty to yang files.
               for(var i=0;i<yangModule.length;i++) {
                   if (yangModule[i].children.length>0) {
                       (function () {
                           try {
                               var st = writeYang(yangModule[i]);//print the module to yang file
                               var path='./project/' + yangModule[i].name.split("-")[0] +'/'+yangModule[i].name+ '.yang';
                               fs.writeFile(path, st);
                           } catch (e) {
                               console.log(e.stack);
                               throw(e.message);
                           }
                           console.log(yangModule[i].name + "write is completed!");
                       })();
                   }
               }
           }
        });
    }catch(e){
        console.log(e.stack);
        throw e.message;
    }
}

function addKey(){
    for(var i=0;i<Class.length;i++){
        var flag=0;
        //search every class,if class's generalization's value is keylist's id,the class will have a key
        if (Class[i].generalization.length!==0) {
            for(var j=0;j<Class[i].generalization.length;j++){
                for(var k=0;k<keylist.length;k++){
                    if( Class[i].generalization[j]==keylist[k].id){
                        Class[i].key=keylist[k].name;
                        flag=1;
                        break;
                    }
                }
                if(flag==1){
                    break;
                }
            }
        }
        //if(flag==0&&Class[i].config){
          //  Class[i].key="localId";
        //}
    }
}

function createKey(){
    var obj=new key("_SU3Q4I30EeO38ZmbECnvbg","uuid");
    keyId.push(obj);
    keylist.push(obj);
    obj=new key("_k5nWYI2wEeO38ZmbECnvbg","localIdList");
    keyId.push(obj);
    keylist.push(obj);

}

function parseModule(filename){
    var xml = fs.readFileSync("./project/" + filename, {encoding: 'utf8'});
    xmlreader.read(xml,function(error,model) {
        if (error) {
            console.log(e.stack);
            throw error;
        } else {
            console.log(filename+" read success!");
            var xmi;
            if(model["xmi:XMI"]){
                xmi = model["xmi:XMI"] ;
                if (xmi["uml:Package"]) {
                    xmi = xmi["uml:Package"];
                    var mainmod;
                    xmi.attributes().name?mainmod=xmi.attributes().name:mainmod="";
                    var path="./project/"+mainmod;
                    if (fs.existsSync(path)){
                        console.log('This directory '+path+" has been created! ");
                    } else {
                        fs.mkdirSync(path);//create this directory
                    }
                    modName.push(mainmod);
                    createKey();
                    var m=new Module(modName.join("-"),"","",modName.join("-"));
                    yangModule.push(m);
                    createElement(xmi);//create object class
                    return;
                }
            }else{
                console.log("empty file!");
            }
        }
    })
}

function createElement(xmi){
    for(var key in xmi){
        if(key=="packagedElement"||key=="ownedOperation"){
            var ele=xmi[key];
            var len;
            var obj;
            xmi[key].array?len=xmi[key].array.length:len=1;
            for (var i = 0; i < len; i++) {
                len==1?obj=ele:obj=ele.array[i];
                if (obj.attributes()["xmi:type"] == "uml:Package"||obj.attributes()["xmi:type"]=="uml:Interface") {
                    var name=obj.attributes().name.replace(/:+\s*/g, '_');
                    modName.push(name);
                    /*  for(var j=0;j<yangModule.length;j++){
                         if(yangModule[j].name==name){
                         yangModule[j].import.push(modName.join("-"));
                         break;
                         }
                         }*/
                    var namespace="'urn:onf:"+modName.join("-")+"'";
                    var m=new Module(modName.join("-"),namespace,"",modName.join("-"));//create a new module by recursion
                    yangModule.push(m);
                    createElement(obj);
                }
                else {
                    var a=obj.attributes()["xmi:type"];
                    //parse xmi:type
                    switch(a){
                        case "uml:Enumeration":createClass(obj,"enumeration");
                            break;
                        case "uml:DataType":createClass(obj,"dataType");
                            break;
                        case "uml:PrimitiveType":createClass(obj,"typedef");
                            break;
                        case "uml:Class":createClass(obj,"grouping");
                            break;
                        case "uml:Operation":createClass(obj,"rpc");
                       //case "uml:AssociationClass":genClass(obj);
                       //     break;
                        case "uml:Association":createAssociation(obj);
                            break;
                        default:break;
                    }
                }
            }
        }
    }
    modName.pop(1);
}

function createClass(obj,nodeType) {
    try {
        var name = obj.attributes().name;
        name = name.replace(/:+\s*/g, '_');
        var id = obj.attributes()["xmi:id"];
        var type = obj.attributes()["xmi:type"].split(":")[1];
        var config;
        obj.attributes().isReadOnly ? config = false : config = true;
        var path;
        if(modName.length>3&&nodeType!=="rpc"){
            path=modName[0]+"-"+modName[1]+"-"+modName[2]
        }else{
            path = modName.join("-");
        }
        if (obj["ownedComment"]) {
            var len;
            var comment = "";
            obj["ownedComment"].array ? len = obj["ownedComment"].array.length : len = 1;
            for (; i < len; i++) {
                len == 1 ? obj = obj["ownedComment"] : obj = obj["ownedComment"].array[i];
                comment += obj["ownedComment"]["body"].text() + "\r";
            }
        }
        var node = new CLASS(name, id, type, comment, nodeType, path, config);
        if (obj.attributes().isAbstract == "true") {
            node.isAbstract = true;
        }
        if (nodeType == "dataType") {
            node.isGrouping = true;
            if (obj['ownedAttribute'] && obj['ownedAttribute'].array || obj['generalization']) {
                node.nodeType = "grouping";
            } else {
                node.nodeType = "typedef";
                nodeType = "typedef";
                Typedef.push(node);
            }
        }
        if (obj['generalization']) {
            var len;
            obj['generalization'].array ? len = obj['generalization'].array.length : len = 1;
            for (var i = 0; i < len; i++) {
                var gen;
                len == 1 ? gen = obj['generalization'] : gen = obj['generalization'].array[i];
                node.buildGeneral(gen);
                //将uses的type值添加到grouping数组中
                for (var j = 0; j < Grouping.length; j++) {
                    if (Grouping[j] == node.generalization[i]) {
                        break;
                    }
                }
                if (j == Grouping.length) {
                    Grouping.push(node.generalization[i]);
                }
            }
        }
        if (obj['ownedAttribute']) {
            var len;
            obj['ownedAttribute'].array ? len = obj['ownedAttribute'].array.length : len = 1;
            for (var i = 0; i < len; i++) {
                var att;
                len == 1 ? att = obj['ownedAttribute'] : att = obj['ownedAttribute'].array[i];
                //r is the value of "type"
                var r = node.buildAttribute(att);
                if (r !== "basicType") {
                    //add r to "Grouping" array
                    for (var j = 0; j < Grouping.length; j++) {
                        if (Grouping[j] == r) {
                            break;
                        }
                    }
                    if (j == Grouping.length) {
                        Grouping.push(r);
                    }
                    //if the nodeType of element referencing r is "list",new an object "association"
                    if(node.attribute[i].nodeType=="list"){
                        for(var j=0;j<association.length;j++){
                            if(r==association.name){
                                break;
                            }
                        }
                        if(j==association.length){
                            var a = new assoc(r,node.attribute[i].id,"list", node.attribute[i].upperValue, node.attribute[i].lowerValue);
                            association.push(a);
                        }
                    }

                    //add "path"
                    if( !node.attribute[i].isleafRef&&node.type == "Class"){
                        var instance={};
                        instance.id=r;
                        instance.path=node.path+":"+node.name+"/"+node.attribute[i].name;
                        isInstantiated.push(instance);
                    }
                }
                //search the "keyId",if r is the value of "keyId",add this node to keyList
                for (var j = 0; j <keyId.length; j++) {
                    if (r == keylist[j].id) {
                        node.key = keylist[j].name;
                        var a = new key(node.id, keylist[j].name);
                        node.attribute[i].key = keylist[j].name;
                        keylist.push(a);
                        break;
                    }
                }
            }
        }
        if (node.isEnum()) {
            node.buildEnum(obj);
            Typedef.push(node);
        }
        if (nodeType == "typedef") {
            if (obj['type']) {
                var typedefType = obj['type'].attributes();
                if (typedefType['xmi:type'] == 'uml:PrimitiveType') {
                    node.type = typedefType.href.split('#')[1].toLocaleLowerCase();
                } else {
                    node.type = node.type.href;
                }
            } else {
                node.type = "string";
            }
            Typedef.push(node);
        }
        if (obj['ownedParameter']) {
            var len;
            obj['ownedParameter'].array ? len= obj['ownedParameter'].array.length :len = 1;
            for (var i = 0; i <len; i++) {
                var para;
                len== 1 ? para = obj['ownedParameter'] : para = obj['ownedParameter'].array[i];
                r =node.buildOperate(para);

                if (r !== "basicType") {
                    for (var k = 0; k < Grouping.length; k++) {
                        if (Grouping[j] == r) {
                            break;
                        }
                    }
                    if (k == Grouping.length) {
                        Grouping.push(r);
                    }
                    if(node.attribute[i].nodeType=="list"){
                        for(var j=0;j<association.length;j++){
                            if(r==association.name){
                                break;
                            }
                        }
                        if(j==association.length){
                            var a = new assoc(r,node.attribute[i].id,"list", node.attribute[i].upperValue, node.attribute[i].lowerValue);
                            association.push(a);
                        }
                    }
                }

            }
        }
        //if(node.key==undefined){
        //    node.key="localId";
        //}
        Class.push(node);
        return;
    }
    catch(e){
        console.log(e.stack);
        throw e.message;
    }
}

function createAssociation(obj) {
    var ele;
    var len;
    if (obj.ownedEnd) {
        obj.ownedEnd.array ? len = obj.ownedEnd.array.length : len = 1;
        for (var i = 0; i < len; i++) {
            obj.ownedEnd.array ? ele = obj.ownedEnd.array[i] : ele = obj.ownedEnd;
            var name = ele.attributes().type;
            var id = ele.attributes()['xmi:id'];
            var type;
            var upperValue;
            ele.upperValue ? upperValue = ele.upperValue.attributes().value : upperValue = 1;
            var lowerValue;
            ele.lowerValue ? lowerValue = ele.lowerValue.attributes().value : lowerValue = 1;
            if (parseInt(upperValue) !== 1) {
                for(var i=0;i<association.length;i++){
                    if(name==association.name){
                        break;
                    }
                }
                if(i==association.length){
                    type = "list";
                    var a = new assoc(name, id, type, upperValue, lowerValue);
                    association.push(a);
                }
            }
        }
    }
}

function obj2yang(ele){
    for(var i=0;i<ele.length;i++){
        var obj;
        if(ele[i].nodeType=="rpc"){
            obj=new RPC(ele[i].name,ele[i].description);
        }else{
            var obj=new Node(ele[i].name,ele[i].description,"grouping",ele[i]["max-elements"],ele[i]["max-elements"],ele[i].id,ele[i].config);
            obj.key=ele[i].key;
            obj.isAbstract=ele[i].isAbstract;
        }
        // decide whether the "nodeType" of "ele" is grouping
        if(!ele[i].isAbstract) {
            for (var j = 0; j < Grouping.length; j++) {
                if (ele[i].id == Grouping[j]) {
                    break;
                }
            }
            if (j == Grouping.length && ele[i].type !== "DataType") {
                //if the ele is grouping ,"obj.nodeType" is  "container"
                obj.nodeType = "container";
            }
        }
        //create the object of "typedef"
        if(ele[i].nodeType=="enumeration") {
            obj.nodeType="typedef";
            if(ele[i].generalization.length>0){
                for(var j=0;j<ele[i].generalization.length;j++) {
                    for (var k=0; k< Typedef.length; k++) {
                        if(ele[i].generalization[j]==Typedef[k].id){
                            ele[i].attribute[0].children=ele[i].attribute[0].children.concat(Typedef[k].attribute[0].children);
                            break;
                        }
                    }
                }
                ele[i].generalization=[];
            }
            for (var j = 0; j < ele[i].attribute.length; j++) {
                obj.buildChild(ele[i].attribute[j], "enumeration");
            }
        }
        //convert the "generalization" to "uses"
        if(ele[i].generalization.length!==0) {
            for(var j=0;j<ele[i].generalization.length;j++){
                for(var k=0;k<Class.length;k++){
                    if(Class[k].id==ele[i].generalization[j]){
                        if(ele[i].path== Class[k].path){
                            obj.uses.push(Class[k].name);
                        }
                        else{
                            obj.uses.push(Class[k].path+":"+Class[k].name);
                            importMod(ele[i],Class[k]);
                        }
                        break;
                    }
                }
            }
        }
        //deal with the ele whose "nodeType" is "grouping"
        if(ele[i].nodeType=="grouping"){
            //create the "children" of object node(obj);
            for (var j = 0; j < ele[i].attribute.length; j++) {
                //decide whether the subnode is "Derived Types"
                for(var k=0;k<Typedef.length;k++){
                    if(Typedef[k].id==ele[i].attribute[j].type){
                        if(ele[i].attribute[j].nodeType=="container"){
                            ele[i].attribute[j].nodeType="leaf";
                        }else if(ele[i].attribute[j].nodeType=="list"){
                            ele[i].attribute[j].nodeType="leaf-list";
                        }
                        ele[i].attribute[j].isUses=false;
                        if(Typedef[k].path==ele[i].path){
                            ele[i].attribute[j].type=Typedef[k].name;
                        }else{
                            ele[i].attribute[j].type=Typedef[k].path+":"+Typedef[k].name;
                            importMod(ele[i],Typedef[k]);//add element "import" to module
                        }
                    }
                }
                //deal with the subnode whose type is neither "Derived Types" nor "Build-in Type".
                if(ele[i].attribute[j].isUses){
                    var name=ele[i].attribute[j].type;
                    //find the "class" whose value of "id" is value of "type"
                    for(var k=0;k<Class.length;k++){
                        if(Class[k].id==name){
                            if(Class[k].type!=="Class"){
                                ele[i].attribute[j].isleafRef=false;
                            }
                            ele[i].attribute[j].isAbstract=Class[k].isAbstract;
                            if(Class[k].type!=="Class"){
                                ele[i].attribute[j].isGrouping=true;
                            }
                            //recursion
                            ele[i].attribute[j].key=Class[k].key;
                            if(i==k){
                                ele[i].attribute[j].type="leafref+path '/"+Class[k].instancePath.split(":")[1]+"'";
                                if(Class[k].isAbstract){
                                    ele[i].attribute[j].type="string";
                                }
                                if(ele[i].attribute[j].nodeType=="list"){
                                    ele[i].attribute[j].nodeType="leaf-list";
                                }
                                else if(ele[i].attribute[j].nodeType=="container"){
                                    ele[i].attribute[j].nodeType="leaf";
                                }
                                break;
                            }
                            else {
                                if(ele[i].attribute[j].isleafRef){
                                    var p=Class[k].instancePath.split(":")[0];
                                    if(ele[i].path == p){
                                        ele[i].attribute[j].type="leafref+path '/"+Class[k].instancePath.split(":")[1]+"'";
                                    }else{
                                        ele[i].attribute[j].type="leafref+path '/"+Class[k].instancePath+"'";
                                        //add element "import" to module
                                        for (var t = 0; t < yangModule.length; t++) {
                                            if (ele[i].path == yangModule[t].name) {
                                                for (var f = 0; f < yangModule[t].import.length; f++) {
                                                    if (yangModule[t].import[f] == p) {
                                                        break;
                                                    }
                                                }
                                                if (f == yangModule[t].import.length) {
                                                    yangModule[t].import.push(p);
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    //
                                    if(Class[k].isAbstract){
                                        ele[i].attribute[j].type="string";
                                    }
                                    //
                                    if(ele[i].attribute[j].nodeType=="list"){
                                        ele[i].attribute[j].nodeType="leaf-list";
                                    }
                                    else if(ele[i].attribute[j].nodeType=="container"){
                                        ele[i].attribute[j].nodeType="leaf";
                                    }
                                    break;
                                }
                                else{
                                    if (ele[i].path == Class[k].path) {
                                        ele[i].attribute[j].isUses = Class[k].name;
                                        break;
                                    } else {
                                        importMod(ele[i],Class[k]);//add element "import" to module
                                        ele[i].attribute[j].isUses = Class[k].path + ":" + Class[k].name;
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    //did't find the "class"
                    if(k==Class.length){
                        ele[i].attribute[j].nodeType=="list"?ele[i].attribute[j].nodeType="leaf-list":ele[i].attribute[j].nodeType="leaf";
                        ele[i].attribute[j].type="string";
                    }
                }
                obj.buildChild(ele[i].attribute[j], ele[i].attribute[j].nodeType);//create the subnode to obj
            }
        }
        //create the object of "typedef"
        if(ele[i].nodeType=="typedef"){
            obj.nodeType="typedef";
            if(ele[i].attribute[0]){
                obj.buildChild(ele[i].attribute[0], "typedef");

            }else{
                obj.buildChild(ele[i], "typedef");
            }
        }
        //create "rpc"
        if(ele[i].nodeType=="rpc"){
            for (var j = 0; j < ele[i].attribute.length; j++) {
                var pValue = ele[i].attribute[j];
                for(var k=0;k<Typedef.length;k++){
                    if(Typedef[k].id==pValue.type){
                        pValue.nodeType="leaf";
                        pValue.isUses=false;
                        if(Typedef[k].path==ele[i].path){
                            pValue.type=Typedef[k].name;
                        }else{
                            pValue.type=Typedef[k].path+":"+Typedef[k].name;
                            importMod(ele[i],Typedef[k]);
                        }
                        break;
                    }
                }
                if( pValue.isUses){
                    var name= pValue.type;
                    for(var k=0;k<Class.length;k++){
                        if(Class[k].id==name){
                            pValue.isAbstract=Class[k].isAbstract;
                            if(Class[k].type!=="Class"){
                                pValue.isGrouping=true;
                            }
                            //recursion
                            if(i==k){
                                pValue.type="leafref+path '/"+Class[k].instancePath.split(":")[1]+"'";
                                if(Class[k].isGrouping){
                                    pValue.type="string";
                                }
                                if( pValue.nodeType=="list"){
                                    pValue.nodeType="leaf-list";
                                }
                                else if( pValue.nodeType=="container"){
                                    pValue.nodeType="leaf";
                                }
                                break;
                            }
                            /*else {
                                 if( pValue.isleafRef){
                                    var p=Class[k].instancePath.split(":")[0];
                                    if(ele[i].path == p){
                                        pValue.type="leafref+path '/"+Class[k].instancePath.split(":")[1]+"'";
                                    }else{
                                        pValue.type="leafref+path '/"+Class[k].instancePath+"'";
                                        importMod(ele[i],p);
                                    }
                                    //
                                    if(Class[k].isAbstract){
                                        pValue.type="string";
                                     }
                                     //
                                    if( pValue.nodeType=="list"){
                                        pValue.nodeType="leaf-list";
                                    }
                                    else if( pValue.nodeType=="container"){
                                        pValue.nodeType="leaf";
                                    }
                                    break;
                                }*/
                            else{
                                if (ele[i].path == Class[k].path) {
                                    pValue.isUses = Class[k].name;
                                }
                                else {
                                    //
                                    importMod(ele[i],Class[k]);//add element "import" to module
                                    pValue.isUses = Class[k].path + ":" + Class[k].name;
                                    }
                                pValue.key=Class[k].key;
                                break;
                                }
                            }
                        //}
                    }
                    if(k==Class.length){
                        pValue.nodeType=="list"?ele[i].attribute[j].nodeType="leaf-list":pValue.nodeType="leaf";
                        pValue.type="string";
                    }
                }
                obj.buildChild(pValue, pValue.nodeType, pValue.rpcType);
            }
        }
        //decide whether a "container" is "list"
        if(obj.nodeType=="container") {
            for (var k = 0; k < association.length; k++) {
                if (ele[i].id == association[k].name) {
                    obj.nodeType = "list";
                    if(association[k].upperValue){
                        obj["max-elements"]=association[k].upperValue;
                    }
                    if(association[k].lowerValue){
                        obj["min-elements"]=association[k].lowerValue;
                    }
                    break;
                }
            }
        }
        //add the "obj" to module by attribute "path"
        for(var t=0;t<yangModule.length;t++){
            if(yangModule[t].name==ele[i].path){
                //create a new node if "ele" needs to be instantiate
                var newobj;
                if(ele[i].isAbstract==false&&ele[i].isGrouping==false&&obj.nodeType=="grouping"){
                    newobj=new Node(obj.name,undefined,"container",undefined,undefined,obj.id,obj.config);
                    newobj.key=obj.key;
                    newobj.uses.push(obj.name);
                    //decide whether a "container" is "list"
                    for (var k = 0; k < association.length; k++) {
                        if (ele[i].id == association[k].name) {
                            newobj.nodeType = "list";
                            if(association[k].upperValue){
                                newobj["max-elements"]=association[k].upperValue;
                            }
                            if(association[k].lowerValue){
                                newobj["min-elements"]=association[k].lowerValue;
                            }
                            break;
                        }
                    }
                    yangModule[t].children.push(newobj);
                }
                yangModule[t].children.push(obj);
                break;
            }
        }
        yang.push(obj);
    }
    console.log("translate success!")
}

function importMod(ele,obj){
    for (var t = 0; t < yangModule.length; t++) {
        if (ele.path == yangModule[t].name) {
            for (var f = 0; f < yangModule[t].import.length; f++) {
                if (yangModule[t].import[f] == obj.path) {
                    break;
                }
            }
            if (f == yangModule[t].import.length) {
                yangModule[t].import.push(obj.path);
                break;
            }
        }
    }

}

function writeYang(obj) {
    var layer = 0;
    var st = obj.writeNode(layer);
    var res = st.replace(/\t/g, '    ');
    return res;
}