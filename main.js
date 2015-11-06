/********************************************************************************************************
 * Name: UML to YANG Mapping Tool
 * Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 *
 * This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.04 by OpenNetworkFoundation(ONF) IMP group.
 *
 * file: \main.js
 *
 * The above copyright information should be included in all distribution, reproduction or derivative works of this software.
 *
 ****************************************************************************************************/
var xmlreader = require('xmlreader'),
    fs = require('fs'),
    CLASS = require('./model/ObjectClass.js'),
    assoc = require('./model/Association.js'),
    Node = require('./model/yang/node.js'),
    Module = require('./model/yang/module.js'),
    RPC = require('./model/yang/rpc.js');

var Typedef = [];
var isAbstract = [];
var Class = [];
var association = [];
var yang = [];
var isGrouping = [];
var modName = [];
var yangModule = [];
var keylist = [];

function key(id, name) {
    this.id = id;//id为key值所在节点的父节点id
    this.name = name;//name为key取值
}

var result = main_Entrance();

function main_Entrance() {
    try {
        //var xml=fs.readFileSync("./project/CoreModel.xml",{encoding:'utf8'});
        var xml = fs.readFileSync("./project/CoreModel.xml", {encoding: 'utf8'});
    } catch (e) {
        throw e.message;
    }
    xmlreader.read(xml, function (error, model) {
        if (error) {
            console.log(e.message);//xml转换为obj失败
        } else {
            console.log("xmi read success!");
            var xmi;
            if (model["xmi:XMI"]) {
                xmi = model["xmi:XMI"];
                if (xmi["uml:Package"]) {
                    xmi = xmi["uml:Package"];
                    var mainmod;
                    xmi.attributes().name ? mainmod = xmi.attributes().name : mainmod = "";
                    modName.push(mainmod);
                    createKey();
                    var m = new Module(modName.join("-"), "", "", modName.join("-"));
                    yangModule.push(m);
                    createElement(xmi);
                    obj2yang(Class);
                    for (var i = 0; i < yangModule.length; i++) {
                        if (yangModule[i].children.length > 0) {
                            (function () {
                                try {
                                    var st = writeYang(yangModule[i]);
                                    fs.writeFile('./project/' + yangModule[i].name + '.yang', st);
                                } catch (e) {
                                    throw(e.message);
                                }
                                console.log(yangModule[i].name + "write is completed!");
                            })();
                        }
                    }
                }

            } else {
                console.log("empty file!");
            }
        }
    })
}

function createKey() {
    var obj = new key("_iVJ1kI2wEeO38ZmbECnvbg", "uuid");
    keylist.push(obj);
}

function createElement(xmi) {
    for (var key in xmi) {
        if (key == "packagedElement") {
            var ele = xmi[key];
            var len;
            var obj;
            xmi[key].array ? len = xmi[key].array.length : len = 1;
            for (var i = 0; i < len; i++) {
                len == 1 ? obj = ele : obj = ele.array[i];
                if (obj.attributes()["xmi:type"] == "uml:Package") {
                    var name = modName.join("-");
                    modName.push(obj.attributes().name);
                    /*  for(var j=0;j<yangModule.length;j++){
                     if(yangModule[j].name==name){
                     yangModule[j].import.push(modName.join("-"));
                     break;
                     }
                     }*/
                    var namespace = "'urn:onf:" + modName.join("-") + "'";
                    var m = new Module(modName.join("-"), namespace, "", modName.join("-"));
                    yangModule.push(m);
                    createElement(obj);
                }
                else {
                    var a = obj.attributes()["xmi:type"];
                    switch (a) {
                        case "uml:Enumeration":
                            createClass(obj, "enumeration");
                            break;
                        case "uml:DataType":
                            createClass(obj, "dataType");
                            break;
                        case "uml:PrimitiveType":
                            createClass(obj, "typedef");
                            break;
                        case "uml:Class":
                            createClass(obj, "grouping");
                            break;
                        case "uml:Interface":
                            createClass(obj, "interface");
                        //case "uml:AssociationClass":genClass(obj);
                        //     break;
                        case "uml:Association":
                            createAssociation(obj);
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }
    modName.pop(1);
}

function createClass(obj, nodeType) {
    var name = obj.attributes().name;
    var id = obj.attributes()["xmi:id"];
    var type = obj.attributes()["xmi:type"].split(":")[1];
    var path;
    if (obj["ownedComment"]) {
        var len;
        var comment = "";
        obj["ownedComment"].array ? len = obj["ownedComment"].array.length : len = 1;
        for (; i < len; i++) {
            len == 1 ? obj = obj["ownedComment"] : obj = obj["ownedComment"].array[i];
            comment += obj["ownedComment"]["body"].text() + "\r";
        }
    }
    path = modName.join("-");
    var node = new CLASS(name, id, type, comment, nodeType, path);
    if (obj.attributes().isAbstract == "true") {
        node.isAbstract = true;
    }
    if (node.isEnum()) {
        var e = node.buildEnum(obj);
        node.attribute.push(e);
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

    if (obj['ownedAttribute']) {
        if (nodeType == "dataType") {
            if (!obj['ownedAttribute'].array && !obj['generalization']) {
                node.nodeType = "typedef";
                Typedef.push(node);
            }
            else if (obj['ownedAttribute'].array || obj['generalization'] && nodeType == "dataType") {
                node.nodeType = "grouping";
            }
            node.buildAttribute(obj['ownedAttribute']);
        }
        else {
            var r = node.buildAttribute(obj['ownedAttribute']);
            for (var i = 0; i < r.length; i++) {
                for (var j = 0; j < isGrouping.length; j++) {
                    if (isGrouping[j] == r[i] || r[i] == null) {
                        break;
                    }
                }
                if (j == isGrouping.length) {
                    isGrouping.push(r[i]);
                }
            }
        }
        //type不为基本值或generalization值为一串字符的值为grouping
        /* for(var i=0;i<node.attribute.length;i++){
         if( node.attribute[i].type==keylist[0].id){
         keylist.push(new key(node.id,keylist[0].name));
         break;
         }
         }*/
    }
    else if (nodeType == "dataType") {
        node.nodeType = "typedef";
        if (obj['type']) {
            node.type = obj['type'].attributes();
            if (node.type['xmi:type'] == 'uml:PrimitiveType') {
                node.type = node.type.href.split('#')[1].toLocaleLowerCase();
            } else {
                node.type = node.type.href;
            }
        } else {
            node.type = "string";
        }
        Typedef.push(node);
    }

    if (obj['generalization']) {
        r = node.buildGeneral(obj['generalization']);
        /*  for(var i=0;i<r.length;i++){
         if( r[i]==keylist[0].id){
         keylist.push(new key(node.id,keylist[0].name));
         break;
         }
         }*/

        for (var i = 0; i < r.length; i++) {
            for (var j = 0; j < isGrouping.length; j++) {
                if (isGrouping[j] == r[i] || r[i] == null) {
                    break;
                }
            }
            if (j == isGrouping.length) {
                isGrouping.push(r[i]);
            }
        }
    }

    if (obj['ownedOperation']) {
        obj['ownedOperation'].array ? len = obj['ownedOperation'].array.length : len = 1;
        var a;
        for (var i = 0; i < len; i++) {
            len == 1 ? a = obj['ownedOperation'] : a = obj['ownedOperation'].array[i];
            var childNode = new CLASS(a.attributes().name, a.attributes()["xmi:id"], "Operation", a.attributes().comment, "rpc", path);
            if (a['ownedParameter']) {
                r = childNode.buildOperate(a['ownedParameter']);
                for (var k = 0; k < r.length; k++) {
                    for (var j = 0; j < isGrouping.length; j++) {
                        if (isGrouping[j] == r[k] || r[k] == null) {
                            break;
                        }
                    }
                    if (k == isGrouping.length) {
                        isGrouping.push(r[k]);
                    }
                }
            }
            node.attribute.push(childNode);
        }

    }
    Class.push(node);
    return;
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
            upperValue = ele.upperValue.attributes().value;
            var lowerValue;
            lowerValue = ele.lowerValue.attributes().value;
            if (parseInt(upperValue) !== 1) {
                type = "list";
                var a = new assoc(name, id, type, upperValue, lowerValue);
                association.push(a);
            }
        }
    }

}

function obj2yang(ele) {
    for (var i = 0; i < ele.length; i++) {
        var isList = false;
        var obj = new Node(ele[i].name, ele[i].description, "grouping", ele[i]["max-elements"], ele[i]["max-elements"], ele[i].id);
        for (var j = 0; j < isGrouping.length; j++) {
            if (ele[i].id == isGrouping[j]) {
                ele[i].notGrouping = false;
                break;
            }
        }
        if (j == isGrouping.length) {
            obj.nodeType = "container";
        }
        if (ele[i].nodeType == "enumeration") {
            for (var j = 0; j < ele[i].attribute.length; j++) {
                obj.buildChild(ele[i].attribute[j], "enumeration");
            }
        }
        if (ele[i].nodeType == "grouping") {
            //生成主节点中的各子节点
            for (var j = 0; j < ele[i].attribute.length; j++) {
                //子节点type为typedef中的值时，type定为leaf
                for (var k = 0; k < Typedef.length; k++) {
                    if (Typedef[k].id == ele[i].attribute[j].type) {
                        ele[i].attribute[j].nodeType = "leaf";
                        ele[i].attribute[j].isUses = false;
                        if (Typedef[k].path == ele[i].path) {
                            ele[i].attribute[j].type = Typedef[k].name;
                        } else {
                            ele[i].attribute[j].type = Typedef[k].path + ":" + Typedef[k].name;
                        }
                    }
                }

                if (ele[i].attribute[j].isUses) {
                    var name = ele[i].attribute[j].type;
                    for (var k = 0; k < Class.length; k++) {
                        if (Class[k].id == name) {
                            //若为递归即节点内部子节点引用父节点
                            if (i == k) {
                                ele[i].attribute[j].type = "leafref+path '/" + Class[k].name + "/uuid'";
                                if (ele[i].attribute[j].nodeType == "list") {
                                    ele[i].attribute[j].nodeType = "leaf-list";
                                } else if (ele[i].attribute[j].nodeType == "container") {
                                    ele[i].attribute[j].nodeType = "leaf";
                                }
                                break;
                            } else {
                                if (ele[i].path == Class[k].path) {
                                    ele[i].attribute[j].isUses = Class[k].name;
                                } else {
                                    //在module中添加import节点
                                    for (var t = 0; t < yangModule.length; t++) {
                                        if (ele[i].path == yangModule[t].name) {
                                            for (var f = 0; f < yangModule[t].import.length; f++) {
                                                if (yangModule[t].import[f] == Class[k].path) {
                                                    break;
                                                }
                                            }
                                            if (f == yangModule[t].import.length) {
                                                yangModule[t].import.push(Class[k].path);
                                            }
                                        }
                                    }
                                    ele[i].attribute[j].isUses = Class[k].path + ":" + Class[k].name;

                                }
                            }
                        }
                    }
                }
                //查找最外层节点的子节点是否存在keylist的预先设定值，若存在，则具有key属性（list才具有key值）
                for (var k = 0; k < keylist.length; k++) {
                    if (ele[i].attribute[j].type == keylist[k].id) {
                        obj.key = keylist[k].name;
                        break;
                    }
                }
                obj.buildChild(ele[i].attribute[j], ele[i].attribute[j].nodeType);

            }
        }
        if (ele[i].nodeType == "typedef") {
            obj.nodeType = "typedef";
            if (ele[i].attribute[0]) {
                obj.buildChild(ele[i].attribute[0], "typedef");

            } else {
                obj.buildChild(ele[i], "typedef");
            }
        }
        if (ele[i].nodeType == "interface") {
            for (var j = 0; j < ele[i].attribute.length; j++) {
                var c = new RPC(ele[i].attribute[j].name, ele[i].attribute[j].description);
                if (ele[i].attribute[j].attribute.length > 0) {
                    for (var t = 0; t < ele[i].attribute[j].attribute.length; t++) {
                        var pValue = ele[i].attribute[j].attribute[t];
                        if (pValue.isUses) {
                            var name = pValue.type;
                            for (var k = 0; k < Class.length; k++) {
                                if (Class[k].id == name) {
                                    //若为递归即节点内部子节点引用父节点
                                    if (ele[i].path == Class[k].path) {
                                        pValue.isUses = Class[k].name;
                                    } else {
                                        //在module中添加import节点
                                        for (var t = 0; t < yangModule.length; t++) {
                                            if (ele[i].path == yangModule[t].name) {
                                                for (var f = 0; f < yangModule[t].import.length; f++) {
                                                    if (yangModule[t].import[f] == Class[k].path) {
                                                        break;
                                                    }
                                                }
                                                if (f == yangModule[t].import.length) {
                                                    yangModule[t].import.push(Class[k].path);
                                                }
                                            }
                                        }
                                        pValue.isUses = Class[k].path + ":" + Class[k].name;
                                    }
                                }
                            }
                        }
                        c.buildChild(pValue, pValue.nodeType, pValue.rpcType);
                        obj.children.push(c);
                    }
                }
                else {
                    obj.children.push(c);
                }
            }
        }
        if (obj.nodeType == "container") {
            for (var k = 0; k < association.length; k++) {
                if (ele[i].id == association[k].name) {
                    obj.nodeType = "list";
                    if (association[k].upperValue) {
                        obj["max-elements"] = association[k].upperValue;
                    }
                    if (association[k].lowerValue) {
                        obj["min-elements"] = association[k].lowerValue;
                    }
                    break;
                }
            }
        }

        if (ele[i].generalization.length !== 0) {
            var arr = [];
            for (var j = 0; j < ele[i].generalization.length; j++) {
                for (var k = 0; k < keylist.length; k++) {
                    if (ele[i].generalization[j] == keylist[k].id) {
                        obj.key = keylist[k].name;
                        break;
                    }
                }
                arr.push(buildUses(Class[i].generalization[j]));
            }
            //        obj.uses = buildUses(Class[i].generalization);
            obj.uses = arr;
        }
        //将所有生成的yang节点插入相应的module中
        for (var t = 0; t < yangModule.length; t++) {
            if (yangModule[t].name == ele[i].path) {
                //将isAbstract为false的节点生成新的节点
                var newobj;
                if (ele[i].isAbstract == false && obj.nodeType == "grouping") {
                    newobj = new Node(obj.name, undefined, "container", undefined, undefined, obj.id);
                    var cuses = [];
                    cuses.push(obj.name);
                    newobj.uses = cuses;
                    newobj.key = obj.key;
                    for (var k = 0; k < association.length; k++) {
                        if (ele[i].id == association[k].name) {
                            newobj.nodeType = "list";
                            newobj.key = obj.key;
                            if (obj.config == true && obj.key == undefined) {
                                newobj.key = "id";
                            }
                            if (association[k].upperValue) {
                                newobj["max-elements"] = association[k].upperValue;
                            }
                            if (association[k].lowerValue) {
                                newobj["min-elements"] = association[k].lowerValue;
                            }
                            break;
                        }
                    }
                    yangModule[t].children.push(newobj);
                }
                yangModule[t].children.push(obj);
            }
        }
        yang.push(obj);
    }
}

//生成yang模型有关uses属性，并将这些结点存于对象的uses属性中
function buildUses(obj) {
    for (var k = 0; k < Class.length; k++) {
        if (Class[k].id == obj) {
            return Class[k].name;
        }
    }
    return;
}

function writeYang(obj) {
    var layer = 0;
    var st = obj.writeNode(layer);
    var res = st.replace(/\t/g, '    ');
    return res;
}
