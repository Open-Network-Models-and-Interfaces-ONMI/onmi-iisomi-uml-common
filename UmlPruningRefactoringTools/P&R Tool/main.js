/********************************************************************************************************
* Name: UML to YANG Mapping Tool
* Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved.
* Licensed under the Apache License, Version 2.0 (the "License").
*
* This tool is developed according to the mapping rules defined in onf2015.261_Mapping_Gdls_UML-YANG.08 by OpenNetworkFoundation(ONF) IMP group.
*
* file: \main.js
*
* The above copyright information should be included in all distribution, reproduction or derivative works of this software.
*
****************************************************************************************************/
var xmlreader = require('xmlreader'),
    xmlwriter = require('xml-writer'),
    xmlbuilder = require('xmlbuilder'),
    fs = require('fs'),
    repl = require('repl'),
    readline = require('readline'),
    prompt = require('prompt'),
    CLASS = require('./model/ObjectClass.js'),
    OpenModelObject = require('./model/OpenModelObject.js');
    Association = require('./model/Association.js'),
    Node = require('./model/yang/node.js'),
    Feature = require('./model/yang/feature.js'),
    Uses = require('./model/yang/uses.js'),
    Module = require('./model/yang/module.js'),
    Package = require('./model/yang/package.js'),
    Type = require('./model/yang/type.js'),
    RPC = require('./model/yang/rpc.js'),
    OpenModelPandr = require('./model/OpenModelPandr.js'),
    Module = require('./model/yang/module.js'),
    ObjectClass = require('./model/ObjectClass.js'),
    Realization = require('./model/yang/Realization.js'),
    ClassCompare = require('./model/classcompare.js'),
    AttributeCompare = require('./model/AttributeCompare.js'),
    buildPrunedAtt=require('./model/buildPrunedAtt.js'),
    AssociationCompare = require('./model/AssociationCompare.js'),
    ClassWithAssociation = require('./model/ClassWithAssociation.js');


var Typedef = [];//The array of basic DataType and PrimitiveType
var realization = [];
var classCompare = [];
var attributeCompare = [];
var associationCompare = [];
var classWithAssociation = [];
var prunedClass=[];
var prunedAttribute=[];
var addedClass=[];
var addedAttribute=[];
var Class = [];//The array of object class
var openModelAtt = [];//The array of openmodelprofile
var openModelclass = [];//The array of openmodelprofile
var openModelpandr = [];
var association = [];//The array of xmi:type="uml:Association" of UML
var yang = [];//The array of yang element translated from UML
var Grouping = [];//The array of grouping type
var modName = [];//The array of package name
var yangModule = [];//The array of yang files name
var keylist = [];
//var keyId = [];//The array of key
var isInstantiated = [];//The array of case that the class is composited by the other class
var packages = [];
var currentFileName;
var supplierFileName = "source.uml";
var clientFileName = "target.uml";
var copyAndSplit;
var copyClassId = [];
var splitClassId = [];
//var copyAttributeId = [];
var copyAssociationId = [];
var supplierId = "";
var clientId = "";
var config = {};
var merges = [];
var use = [];
var file = [];
var prunedFlag=0;


var result = main_Entrance();

function main_Entrance(){
    try{
        createKey(function(flag){
            if(!flag){
                console.log("There is no 'key.cfg' file,please config 'key' first!");
            }
            fs.readdir("./project/",function(err, files){
                if(err){
                    console.log(err.stack);
                    throw err.message;
                } else{
                    var fileNum = 0;
                    var clientFileFlag = 0;
                    if(fs.existsSync("./project/config.txt")){
                        readConfig();
                    }else{
                        console.warn("Warning: There is no config.txt in the project folder.Please recheck you files.");
                        throw (e);
                    }
                    if(fs.existsSync("./project/CopyAndSplit.txt")){
                        readCopyAndSplit();
                    }
                    var flag=0;
                    for(var i = 0; i < files.length; i++) {
                        var allowedFileExtensions = ['xml', 'uml'];
                        var currentFileExtension = files[i].split('.').pop();
                        //if(allowedFileExtensions.indexOf(currentFileExtension) !== -1 && (files[i].toLowerCase()==supplierFileName|| files[i].toLowerCase()==clientFileName) ) {   //match postfix of files
                        if(allowedFileExtensions.indexOf(currentFileExtension) !== -1 && files[i] != "mapping.uml" && files[i].toLowerCase().indexOf("profile.uml") == -1) {
                                currentFileName = files[i];
                            fileNum++;
                           /* if(currentFileName != supplierFileName){
                                file.push(currentFileName);
                            }*/
                            parseModule(files[i]);
                        }
                        if(files[i].toLowerCase() == clientFileName){
                            flag=1;
                        }
                    }
                    if(flag==0){
                        prunedFlag=1;
                        currentFileName = clientFileName;
                        clone();
                        merge(files);
                        copyClass();
                        splitClass();
                        fileNum++;
                        parseModule(clientFileName);
                    }


                /*    for(var i = 0; i < files.length; i++) {
                        if(files[i].toLowerCase() == clientFileName){
                            break;
                        }else{
                            currentFileName = clientFileName;
                            clone();
                            merge();
                            copyClass();
                            splitClass();
                            fileNum++;
                            parseModule(clientFileName);
                        }
                    }*/



                    currentFileName = undefined;
                    //read
                    if(fileNum){
                        for(var i = 0; i < Class.length; i++){
                            pflag = Class[i].id;
                            var path = addPath(Class[i]);
                            if(path == undefined){
                                Class[i].instancePath = Class[i].path + ":" + Class[i].name + "/" + Class[i].key;
                            }else{
                                Class[i].isGrouping = true;
                                Class[i].instancePath = path + "/" + Class[i].key;
                            }
                        }
                        for(var i = 0; i < Class.length; i++){
                            if(Class[i].type == "DataType" && Class[i].nodeType == "grouping" && Class[i].generalization.length == 0){
                                if(Class[i].attribute.length == 1){
                                    if(!Class[i].attribute[0].isUses){
                                        Class[i].nodeType = "typedef";
                                        Class[i].type = Class[i].attribute[0].type;
                                        Class[i].attribute = [];
                                        Typedef.push(Class[i]);
                                    }else{
                                        if(!(Class[i].attribute[0].nodeType == "list" || Class[i].attribute[0].nodeType == "container")){
                                            var t = datatypeExe(Class[i].attribute[0].type, Class[i].fileName);
                                            switch (t.split(",")[0]){
                                                case "enumeration":
                                                    Class[i].attribute = Class[t.split(",")[1]].attribute;
                                                    var a = Class[t.split(",")[1]].generalization;
                                                    if(a.length > 0){
                                                        for(var j = 0; j < a.length; j++){
                                                            for(var k = 0; k < Class.length; k++){
                                                                if(a[j] == Class[k].id && Class[i].fileName == Class[k].fileName){
                                                                    Class[i].attribute = Class[i].attribute.concat(Class[k].attribute);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    Typedef.push(Class[i]);
                                                    break;
                                                case "typedef":
                                                    Class[i].type = t.split(",")[1];
                                                    Class[i].attribute = [];
                                                    Typedef.push(Class[i]);
                                                    break;
                                                default:break;
                                            }
                                            Class[i].nodeType = t.split(",")[0];
                                        }
                                    }
                                }

                            }
                            for(var k = 0; k < openModelclass.length; k++) {
                                if(openModelclass[k].id == Class[i].id && openModelclass[k].fileName == Class[i].fileName){
                                    if(openModelclass[k].condition){
                                        Class[i].support = openModelclass[k].support;
                                        Class[i].condition = openModelclass[k].condition;
                                    }
                                    if(openModelclass[k].status){
                                        Class[i].status = openModelclass[k].status;
                                    }
                                    break;
                                }
                            }
                        }
                        obj2yang(Class);//the function is used to mapping to yang
                        parseAssociation();
                        pruningAndRefactoring();
                        writeLogFile(files);
                        writeUml();
                        //xmlWrite();
                        /*for(var i = 0; i < yangModule.length; i++) {
                            if (yangModule[i].children.length > 0) {
                                (function () {
                                    try {
                                        var st = writeYang(yangModule[i]);//print the module to yang file
                                        var path = './project/' + yangModule[i].name +  '.yang';
                                        fs.writeFile(path, st, function(error){
                                            if(error){
                                                console.log(error.stack);
                                                throw(error.message);
                                            }
                                        });
                                    } catch (e) {
                                        console.log(e.stack);
                                        throw(e.message);
                                    }
                                    console.log("write " + yangModule[i].name + ".yang successfully!");
                                })();
                            }
                        }*/

                        console.log("Pruning and refactoring finished!");

                    }else{
                        console.log("There is no .xml file in 'project' directory! Please check your files path")

                    }
                }
            });
        });
    }catch(e){
        console.log(e.stack);
        throw e.message;
    }
}

function readConfig(){
    var data = fs.readFileSync("./project/config.txt", {encoding: 'utf8'});
    try{
        if(data){
            data = data.substring(data.indexOf("{\""));
            data = data.replace(/",\r?\n*/g, "\",");
            data = data.replace(/],\r?\n*/g, "],");
            data = data.replace(/},\r?\n*/g, "},");
            data = data.replace(/\r?\n/g, "<br>");
            data = data.replace(/(<br>)*$/g, "");
            config = JSON.parse(data);
            for(var key in config){
                if(typeof config[key] == "string"){
                    config[key] = config[key].replace(/<br>/g, "\r\n");
                }else if(typeof config[key] == "object"){
                    for(var keykey in config[key]){
                        if(typeof config[key][keykey] == "string"){
                            config[key][keykey] = config[key][keykey].replace(/<br>/g, "\r\n");
                        }
                    }
                }

            }
            var reg = new RegExp('^\\d{4}-\\d{2}-\\d{2}$');
            var date = config.revision.date;
            try{
                if(date){
                    var dateArray = date.split("-");
                    var day = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
                    for(var i = 0; i < dateArray.length; i++){
                        dateArray[i] = parseInt(dateArray[i]);
                    }
                    if(date.match(reg) == null){
                        console.warn("The revision date is not in the correct format (yyyy-mm-dd), please check the config.txt file.");
                        throw (e1);
                    }
                    if(dateArray[1] > 12 || dateArray[1] < 1){
                        console.warn("The month of revision date is invalid, please check the config.txt file.");
                        throw (e1);
                    }
                    if(dateArray[2] > day[dateArray[1]] || dateArray[2] < 1) {
                        if (!(dateArray[0] % 4 == 0 && dateArray[1] == 2 && dateArray[2] == 29)) {
                            console.warn("The revision date is invalid, day is not consistent with month. Please check the config.txt file")
                            throw (e1);
                        }
                    }
                }else{
                    Date.prototype.Format = function (fmt) {
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
                    var currentData = new Date().Format("yyyy-MM-dd");
                    config.revision.date = currentData;
                }
                /*if(!date){
                 }
                 else if(dateArray[1] < 13 && dateArray[2] > day[dateArray[1]]){
                 if(!(dateArray[0] % 4 == 0 && dateArray[1] == 2 && dateArray[2] == 29)){
                 console.warn("The revision date is invalid, the month is not consistent with data. Please check the config.txt file.")
                 throw (e1);
                 }
                 /!*if(parseInt(date.split("-")[0]) > parseInt(currentData.split("-")[0])){
                 console.warn("The revision date is invalid (later than current date or wrong number), please check the config.txt file.")
                 throw (e1);
                 }else if(parseInt(date.split("-")[0]) == parseInt(currentData.split("-")[0]) && parseInt(date.split("-")[1]) > parseInt(currentData.split("-")[1])){
                 console.warn("The revision date is invalid (later than current date or wrong number), please check the config.txt file.")
                 throw (e1);
                 }else if(parseInt(date.split("-")[0]) == parseInt(currentData.split("-")[0]) && parseInt(date.split("-")[1]) == parseInt(currentData.split("-")[1]) && parseInt(date.split("-")[2]) > parseInt(currentData.split("-")[2])){
                 console.warn("The revision date is invalid (later than current date or wrong number), please check the config.txt file.")
                 throw (e1);
                 }*!/
                 }*/
            }catch(e1){
                //console.warn("There are something wrong in config.txt file. Please recheck the date you write in your file.");
                throw (e1.message);
            }

            console.log("config.txt read successfully!");
        }else{
            console.warn('There is no \'config.txt\'. Please recheck your files according to the guideline!');
        }
    }catch (e){
        console.log(e.stack);
        throw (e.message);
    }/*catch (e1){
     console.log("The date has not arrived, please check config.txt file!");
     }*/
}

function readCopyAndSplit(){
    var data = fs.readFileSync("./project/CopyAndSplit.txt", {encoding: 'utf8'});
    try{
        if(data){
            data = data.substring(data.indexOf("{"));
            data = data.replace(/\r\n/g, "");
            copyAndSplit = JSON.parse(data);
            var tempObj1,
                tempObj2;
            if(copyAndSplit.copyClass != null ^ copyAndSplit.copyNumber != null){
                console.warn('Warning: the number of copyClass is not consistent to the number of copyNumber!');
                copyAndSplit.copyClass = null;
                copyAndSplit.copyNumber = null;
            }else if(copyAndSplit.copyClass != null && copyAndSplit.copyNumber != null){
                if(copyAndSplit.copyClass.length != copyAndSplit.copyNumber.length) {
                    console.warn('Warning: the number of copyClass is not consistent to the number of copyNumber!');

                    if (copyAndSplit.copyClass.length < copyAndSplit.copyNumber.length) {
                        tempObj1 = copyAndSplit.copyClass;
                        tempObj2 = copyAndSplit.copyNumber;
                    } else {
                        tempObj1 = copyAndSplit.copyNumber;
                        tempObj2 = copyAndSplit.copyClass;
                    }
                    while (tempObj1.length < tempObj2.length) {
                        tempObj2.pop();
                    }
                }
            }
            if(copyAndSplit.splitClass != null ^ copyAndSplit.splitNumber != null){
                console.warn('Warning: the number of splitClass is not consistent to the number of splitNumber!');
                copyAndSplit.splitClass = null;
                copyAndSplit.splitNumber = null;
            }else if(copyAndSplit.splitClass != null && copyAndSplit.splitNumber != null){
                if(copyAndSplit.splitClass.length != copyAndSplit.splitNumber.length) {
                    console.warn('Warning: the number of splitClass is not consistent to the number of splitNumber!');
                    if (copyAndSplit.splitClass.length < copyAndSplit.splitNumber.length) {
                        tempObj1 = copyAndSplit.splitClass;
                        tempObj2 = copyAndSplit.splitNumber;
                    }else {
                        tempObj1 = copyAndSplit.splitNumber;
                        tempObj2 = copyAndSplit.splitClass;
                    }
                    while (tempObj1.length < tempObj2.length) {
                        tempObj2.pop();
                    }
                }
            }

            //parse copyNumber and splitNumber to int
            if(copyAndSplit.copyNumber){
                for(var i = 0; i < copyAndSplit.copyNumber.length; i++){
                    copyAndSplit.copyNumber[i] = parseInt(copyAndSplit.copyNumber[i]);
                }
            }
            if(copyAndSplit.splitNumber){
                for(var i = 0; i < copyAndSplit.splitNumber.length; i++){
                    copyAndSplit.splitNumber[i] = parseInt(copyAndSplit.splitNumber[i]);
                }
            }

            console.log("CopyAndSplit.txt read successfully!");
        }else{
            console.log('There is no \'CopyAndSplit.txt\'. Please recheck your files according to the guideline!');
        }
    }catch (e){
        console.log(e.stack);
        throw (e.message);
    }
    /*fs.readFile("./project/" + supplierFileName, "UTF-8", function (err, data) {
     if (err) throw err;
     //console.log(data);
     try{
     fs.writeFile("./project/" + clientFileName,data,function (error) {
     console.log('There is no target file. We clone the source file as target file.');
     if(error){
     console.log(error.stack);
     throw(error.message);
     }
     });
     }catch (e){
     console.log(e.stack);
     throw (e.message);
     }
     /!*fs.writeFile("./project/" + clientFileName, data, "UTF-8", function (err) {
     if (err) throw err;
     console.log('There is no target file. We clone the source file as target file.');
     });*!/
     });*/
}

function clone(){
    var data = fs.readFileSync("./project/" + supplierFileName, {encoding: 'utf8'});
    try{
        var indexStart = data.indexOf("name=");
        var indexEnd = data.indexOf("\"", indexStart + 7);
        var name = data.substring(indexStart + 6, indexEnd);
        //data = data.replace(name, "target");
        data = data.replace(name, clientFileName.split(".")[0]);
        fs.writeFileSync("./project/" + clientFileName, data);
        console.log('There is no target file. We clone the source file as target file.');
    }catch (e){
        console.log(e.stack);
        throw (e.message);
    }
}

function merge(files) {
    var files=files;
    var data = fs.readFileSync("./project/" + clientFileName, {encoding: 'utf8'});
    if (merges && merges.length > 0) {
        try {
            for (var i = 0; i < merges.length; i++) {
                if (merges[i].fileName == supplierFileName && merges[i].mergeInto == "") {
                    //find the class will be merged into and reorganization it
                    var reg = new RegExp('\\s+<packagedElement xmi:type="uml:Class" xmi:id="' + merges[i].id + '"[\\s\\S]*?</packagedElement>');
                    if (data.match(reg) == null) {
                        console.warn("Warning: There is no class xmi:id= \"" + merges[i].id + "\" in " + clientFileName + ". Please recheck your input file!")
                        break;
                        //throw (e);
                    }
                    var startIndex = data.indexOf(data.match(reg)[0]);
                    var endIndex = data.indexOf("</packagedElement>", startIndex) + "</packagedElement>".length;
                    var classData = data.substring(startIndex, endIndex);
                    var attStartIndex = 0;
                    var attEndIndex = -1;
                    var attributeData = "";
                    while (classData.match(new RegExp("\\s+<ownedAttribute")) != null) {
                        if (classData.indexOf(classData.match(new RegExp("\\s+<ownedAttribute"))[0], attStartIndex) == -1)
                            break;
                        attStartIndex = classData.indexOf(classData.match(new RegExp("\\s+<ownedAttribute"))[0], attStartIndex);
                        if (classData.indexOf("/>", attStartIndex) < classData.indexOf("\r\n", attStartIndex + 1)) {
                            attEndIndex = classData.indexOf("/>", attStartIndex) + 2;
                        } else {
                            attEndIndex = classData.indexOf("</ownedAttribute>", attStartIndex) + "</ownedAttribute>".length;
                        }
                        attributeData += classData.substring(attStartIndex, attEndIndex);
                        classData = classData.substring(0, attStartIndex) + classData.substring(attEndIndex);
                    }
                    attributeData += "\r\n/>";   //avoid indexOf() = -1
                    var matchData = "";
                    //childrenID is 'used' attributes
                    for (var j = 0; j < merges[i].childrenId.length; j++) {
                        var reg = new RegExp('\\s+<ownedAttribute xmi:type="uml:Property" xmi:id="' + merges[i].childrenId[j]);
                        if (attributeData.match(reg) == null) {
                            console.warn("Warning: There is no attribute xmi:id= \"" + merges[i].childrenId[j] + "\" in " + clientFileName + ". Please recheck your input file!")
                            break;//throw (e);
                        }
                        var matchStartIndex = attributeData.indexOf(attributeData.match(reg)[0]);
                        var matchEndIndex = -1;
                        if (attributeData.indexOf("/>", matchStartIndex) < attributeData.indexOf("\r\n", matchStartIndex + 1)) {
                            matchEndIndex = attributeData.indexOf("/>", matchStartIndex) + 2;
                        } else {
                            matchEndIndex = attributeData.indexOf("</ownedAttribute>", matchStartIndex) + "</ownedAttribute>".length;
                        }
                        matchData += attributeData.substring(matchStartIndex, matchEndIndex);
                    }
                    var insertIndex = classData.indexOf(classData.match(new RegExp('\\s+</packagedElement>')));
                    classData = classData.substring(0, insertIndex) + matchData + classData.substring(insertIndex);
                    data = data.substring(0, startIndex) + classData + data.substring(endIndex);
                }
            }
        } catch (e) {
            console.log(e.stack);
            throw (e.message);
        }
        try {
            for (var i = 0; i < files.length; i++) {
                // source data is the file you will get information.
                var allowedFileExtensions = ['xml', 'uml'];
                var currentFileExtension = files[i].split('.').pop();
                if (allowedFileExtensions.indexOf(currentFileExtension) !== -1 && files[i] != "mapping.uml" && files[i].toLowerCase() !== clientFileName&& files[i].toLowerCase().indexOf("profile.uml")==-1 ) {
                    var sourceData = fs.readFileSync("./project/" + files[i], {encoding: 'utf8'});
                    var openmodelAttId = [];
                    for (var j = 0; j < merges.length; j++) {
                        if (files[i].toLowerCase() == merges[j].fileName && merges[j].mergeInto!="") {
                            var insertData = "";
                            for (var k = 0; k < merges[j].childrenId.length; k++) {
                                var reg = new RegExp('\\s+<ownedAttribute xmi:type="uml:Property" xmi:id="' + merges[j].childrenId[k]);
                                if (sourceData.match(reg) == null) {
                                    console.warn("Warning: There is no attribute xmi:id= \"" + merges[j].childrenId[k] + "\" in " + files[i] + ". Please recheck your input file!")
                                    break;//throw (e);
                                }
                                openmodelAttId.push(merges[j].childrenId[k]);
                                var startIndex = sourceData.indexOf(sourceData.match(reg)[0]);
                                var endIndex = -1;
                                if (sourceData.indexOf("/>", startIndex) < sourceData.indexOf("\r\n", startIndex + 1)) {
                                    endIndex = sourceData.indexOf("/>", startIndex) + 2;
                                } else {
                                    endIndex = sourceData.indexOf("</ownedAttribute>", startIndex) + "</ownedAttribute>".length;
                                }
                                insertData += sourceData.substring(startIndex, endIndex);
                            }
                            /* var reg = new RegExp('xmi:id="[\\w-.]+');
                             var matchData = insertData.match(reg);
                             if(matchData instanceof Array){
                             for(var k = 0; k < matchData.length; k++){
                             insertData = insertData.replace(matchData[k], matchData[k] + "_Mg");
                             }}else{
                             insertData = insertData.replace(matchData, matchData + "_Mg" );
                             }*/
                            var reg = new RegExp('name="[\\w-.]+');
                            var matchData = insertData.match(reg);
                            if (matchData instanceof Array) {
                                for (var k = 0; k < matchData.length; k++) {
                                    insertData = insertData.replace(matchData[k], matchData[k] + "_Mg");
                                }
                            } else {
                                insertData = insertData.replace(matchData, matchData + "_Mg");
                            }
                            //var reg = new RegExp('\\s+<packagedElement xmi:type="uml:Class" xmi:id="' + merges[j].id);
                            var reg = new RegExp('\\s+<packagedElement xmi:type="uml:Class" xmi:id="[\\w-.]+" name="' + merges[j].mergeInto);
                            var matchData = data.match(reg)[0];
                            var insertIndex = data.indexOf(matchData);
                            insertIndex = data.indexOf("</packagedElement>", insertIndex);
                            insertIndex = data.lastIndexOf("\r\n", insertIndex);

                            //Adjust the indentation
                            var indent1 = insertData.indexOf("<") - 2;
                            var indent2 = matchData.indexOf("<");       //indent of class - "\r\n".length + 2
                            if (indent1 != indent2) {
                                var minus = Math.abs(indent1 - indent2);
                                var PRE = "";
                                while (minus--) {
                                    PRE += " ";
                                }
                                if (indent1 > indent2) {
                                    insertData = insertData.replace(new RegExp("\r\n" + PRE, "g"), "\r\n");
                                } else {
                                    insertData = insertData.replace(/\r\n/g, "\r\n" + PRE);

                                }
                            }
                            data = data.substring(0, insertIndex) + insertData + data.substring(insertIndex);
                        }
                    }
                }
            }

            //clear useless class
            for (var j = 0; j < merges.length; j++) {
                if(merges[j].fileName.toLowerCase()==supplierFileName && merges[j].mergeInto!=""){
                    var reg = new RegExp('<ownedAttribute xmi:type="uml:Property" xmi:id="' + merges[j].childrenId[0],'g');
                    var matchData = data.match(reg);
                    var tempIndex;
                    var endIndex=0;
                    for(var k=0;k<matchData.length;k++){
                        tempIndex=data.indexOf(matchData[0],endIndex);
                        var startIndex=data.lastIndexOf("<packagedElement",tempIndex);
                        startIndex=data.lastIndexOf("\r\n",startIndex)+"\r\n".length;
                        endIndex=data.indexOf("</packagedElement>",tempIndex)+"</packagedElement>".length;
                        endIndex=data.indexOf("\r\n",endIndex)+"\r\n".length;
                        var tempData=data.substring(startIndex,endIndex);
                        var tempReg =/name="\w+?_Mg"/g;
                        if(!(tempData.match(tempReg))){
                            data=data.substring(0,startIndex)+data.substring(endIndex);
                        }
                    }
                }
            }
        } catch (e) {
            console.log(e.stack);
            throw (e.message);
        }
        var indexUmlEnd;
        if (data.indexOf("</uml:Package>") != -1) {
            indexUmlEnd = data.indexOf("</uml:Package>") + "</uml:Package>".length;
        } else if (data.indexOf("</uml:Model>") != -1) {
            indexUmlEnd = data.indexOf("</uml:Model>") + "</uml:Model>".length;
        } else {
            console.warn("Warning :Can not find the tag 'uml:Package' or 'uml:Model' of" + clientFileName + "! Please check out the xml file")
        }
        var openModelProfileData = data.substring(indexUmlEnd);         //openModel_Profile part
        var lineDataArray = openModelProfileData.split("\r\n");
        for (var i = 0; i < lineDataArray.length;) {
            if (lineDataArray[i].indexOf("PRStereotypes") != -1) {
                lineDataArray.splice(i, 1);
            } else {
                i++;
            }
        }
        data = data.replace(openModelProfileData, lineDataArray.join("\r\n"));
        var insertOpenModeldata = "";
        if (openmodelAttId && openmodelAttId.length > 0) {
            for (var j = 0; j < openmodelAttId.length; j++) {
                var tempData = "\t<OpenModel_Profile:OpenModelAttribute xmi:id=\"" + openmodelAttId[j] + "_Mg" + "\" base_StructuralFeature=\"" + openmodelAttId[j] + "\"/>" + "\r\n";
                insertOpenModeldata += tempData;
            }
        }
        var indexXmi = data.indexOf("</xmi:XMI>");
        data = data.substring(0, indexXmi) + insertOpenModeldata + data.substring(indexXmi);
        fs.writeFileSync("./project/" + clientFileName, data);
    }
}

function copyClass(){
    var data = fs.readFileSync("./project/" + clientFileName, {encoding: 'utf8'});
    try{
        if(fs.existsSync("./project/CopyAndSplit.txt")){
            if(copyAndSplit.copyClass == null){
                return;
            }
            if(data.indexOf(copyAndSplit.copyClass[0] + "_Cp") != -1){
                return;
            }
            var indexCopyClass,             //the index of the name of CopyClass
                indexSearchClass,           //the index of "<packagedElement xmi:type="uml:Class""
                indexNewLine,               //the index of "\r\n"
                indexEndLocate;             //the index of "</packagedElement>"

            //copy class
            for(var i = 0; i < copyAndSplit.copyClass.length; i++){
                //copy "uml:Class" paragraph and add id postfix
                indexCopyClass = data.indexOf("\"" + copyAndSplit.copyClass[i] + "\"");
                indexSearchClass = data.lastIndexOf("<packagedElement xmi:type=\"uml:Class\"", indexCopyClass);
                /*while(indexCopyClass - indexSearchClass > 100){
                    indexSearchClass = data.indexOf("<packagedElement xmi:type=\"uml:Class\"", indexSearchClass + 1);
                    if(indexSearchClass == -1){
                        break;
                    }
                }*/
                if(indexSearchClass == -1 || indexCopyClass == -1){
                    console.warn("Warning: There is no class named \"" + copyAndSplit.copyClass[i] + "\" in " + clientFileName + ". Please recheck your input file and CopyAndSplit file!")
                    throw (e);
                }
                indexNewLine = data.indexOf('\r\n');
                while(indexSearchClass - indexNewLine > 20 && indexSearchClass > indexNewLine){
                    indexNewLine = data.indexOf("\r\n", indexNewLine + 1);
                    if(indexNewLine == -1){
                        break;
                    }
                }
                if(indexNewLine == -1){
                    console.warn("Warning: There are errors in finding \"" + copyAndSplit.copyClass[i] + "\". Please recheck your source file and CopyAndSplit file!")
                    break;
                }
                indexEndLocate = data.indexOf("</packagedElement>", indexCopyClass);
                var copyData = [];
                // get data of origin class
                var tempData = data.substring(indexNewLine + 2, indexEndLocate + 18);
                var copyclassid = {};
                var lenAttribute;
                var obj;
                //var fullAssociationFlag = false;
                xmlreader.read(tempData, function(error, model) {
                    if (error) {
                        console.log('There was a problem reading data from ' + clientFileName + '. Please check your xmlreader module and nodejs!\t\n' + error.stack);
                    } else {
                        if(model.packagedElement.attributes()["xmi:type"] == "uml:Class"){
                            copyclassid.classId = model.packagedElement.attributes()["xmi:id"];
                            copyclassid.className = copyAndSplit.copyClass[i];
                            copyclassid.attributeId = [];
                            copyclassid.associationId = [];
                            copyclassid.fullAssociationId = [];
                            if(model.packagedElement.ownedAttribute){
                                model.packagedElement.ownedAttribute.array ? lenAttribute = model.packagedElement.ownedAttribute.array.length : lenAttribute = 1;
                                for(var k = 0; k < lenAttribute; k++){
                                    lenAttribute == 1 ? obj = model.packagedElement.ownedAttribute : obj = model.packagedElement.ownedAttribute.array[k];
                                    copyclassid.attributeId.push(obj.attributes()["xmi:id"]);
                                    /*if(obj.attributes().type && (obj.attributes().type == copyclassid.classId)){
                                        fullAssociationFlag = true;
                                    }*/
                                    //copyclassid.attributeName.push(obj.attributes()["name"]);
                                }
                            }
                            copyClassId.push(copyclassid);
                        }
                    }
                });
                var originData = data.substring(indexNewLine + 2, indexEndLocate + 18);
                for(var j = 0; j < copyAndSplit.copyNumber[i]; j++){
                    //get "uml:Class" paragraph
                    var copyLoc = 0;
                    var quoteLoc = 0;
                    var xmiLoc = 0;
                    //var tempCopyData;
                    tempData = data.substring(indexNewLine + 2, indexEndLocate + 18);
                    while(tempData.indexOf("xmi:id=\"",copyLoc) != -1){         //add "_Cp" postfix
                        xmiLoc = tempData.indexOf("xmi:id=\"",copyLoc);
                        quoteLoc = tempData.indexOf("\"",xmiLoc + 10);
                        tempData = tempData.substring(0, quoteLoc) + "_Cp" + (j + 1) + tempData.substring(quoteLoc);
                        copyLoc = quoteLoc;
                    }
                    copyLoc = 0;
                    quoteLoc = 0;
                    xmiLoc = 0;
                    while(tempData.indexOf("annotatedElement",copyLoc) != -1){
                        xmiLoc = tempData.indexOf("annotatedElement",copyLoc);
                        quoteLoc = tempData.indexOf("\"",xmiLoc + 20);
                        tempData = tempData.substring(0, quoteLoc) + "_Cp" + (j + 1) + tempData.substring(quoteLoc);
                        copyLoc = quoteLoc;
                    }
                    copyLoc = 0;
                    quoteLoc = 0;
                    xmiLoc = 0;
                    while(tempData.indexOf("name=\"",copyLoc) != -1){
                        xmiLoc = tempData.indexOf("name=\"",copyLoc);
                        quoteLoc = tempData.indexOf("\"",xmiLoc + 7);
                        tempData = tempData.substring(0, quoteLoc) + "_Cp" + (j + 1) + tempData.substring(quoteLoc);
                        copyLoc = quoteLoc;
                    }
                    /*if(fullAssociationFlag){
                        tempData = addAssociationAttribute(tempData, j + 1, i);
                    }*/
                    copyData.push(tempData);
                }
                data = data.substring(0, indexEndLocate + 20) + copyData.join("\r\n") + "\r\n" + data.substring(indexEndLocate + 20);
                indexEndLocate += 20 + copyData.join("\r\n").length;
                var indent = 0;
                if(tempData[0] == " "){
                    indent = tempData.indexOf("<");
                }else if(tempData[0] == "\r"){
                    indent = tempData.indexOf("<") - 2;
                }else{
                    console.warn("Warning: There are some errors in copy class. Please recheck you uml files!");
                }
                /*if(fullAssociationFlag){
                    copyData = fullConnectionAssociation(copyclassid, copyAndSplit.copyNumber[i], indent);
                }else{
                    copyData = "";
                }*/
                //data = data.substring(0, indexEndLocate) + copyData + data.substring(indexEndLocate);
                /*if(fullAssociationFlag){
                    data = data.replace(originData, addAssociationAttribute(originData, 0, i));
                }*/

                for(var j = 0; j < copyAndSplit.copyNumber[i]; j++){
                    for(var k = j + 1; k < copyAndSplit.copyNumber[i] + 1; k++){
                        copyClassId[i].fullAssociationId.push(copyClassId[i].classId + "_Cp" + j + "cp" + k);
                        //break;
                    }
                }
                //tempData = data.substring(indexNewLine + 2, indexEndLocate + 18);
                //data = data.substring(0, indexNewLine + 2) + addAssociationAttribute(tempData, 0, i); + data.substring(indexEndLocate + 18);

                
            }
            if(copyAndSplit.copyClass.length != copyClassId.length){
                console.warn("Warning: the length of copyClass is not consistent to the length of copyClassId.");
            }



            //get all "uml:Association" packages
            var indexStart = 0;
            var indexEnd = 0;
            var associationData = "";

            var addData = "";
            var tempData = "";
            //copyClassId[i].associationId = [];
            while(data.indexOf("<packagedElement xmi:type=\"uml:Association\"", indexEnd) != -1){
                indexStart = data.indexOf("<packagedElement xmi:type=\"uml:Association\"", indexEnd);
                indexStart = data.indexOf("\r\n", indexStart - 20);
                /*var indexTemp = data.indexOf(/\r\n\s+<packagedElement xmi:type="uml:Association"/g, indexEnd);
                if(indexTemp == indexStart){
                    console.log("equal.");
                }else{
                    console.log("not equal.");
                }
                */
                indexEnd = data.indexOf("</packagedElement>", indexStart);
                indexEnd += "</packagedElement>".length;
                associationData = data.substring(indexStart, indexEnd);
                var associationId;
                xmlreader.read(associationData, function(error, model) {
                    if (error) {
                        console.log('There was a problem reading data from ' + clientFileName + '. Please check your xmlreader module and nodejs!\t\n' + error.stack);
                    } else {
                        associationId = model.packagedElement.attributes()["xmi:id"];
                    }
                });
                for(var j = 0; j < association.length; j++){
                    if(associationId == association[j].id){
                        //console.log(" ");
                        var copyFlag1 = false;
                        var copyFlag2 = false;
                        /*if(association[j].associationType == 0){
                            copyFlag1 = copyAssociationOrNot(association[j].memberEnd1, "attribute");
                            copyFlag2 = copyAssociationOrNot(association[j].memberEnd2, "attribute");
                        }else if(association[j].associationType == 1){
                            copyFlag1 = copyAssociationOrNot(association[j].memberEnd1, "attribute");
                            copyFlag2 = copyAssociationOrNot(association[j].memberEnd2, "class");
                        }else if(association[j].associationType == 2){
                            copyFlag1 = copyAssociationOrNot(association[j].memberEnd1, "class");
                            copyFlag2 = copyAssociationOrNot(association[j].memberEnd2, "class");
                        }*/
                        if(association[j].associationType == 1){
                            copyFlag1 = copyAssociationOrNot(association[j].memberEnd1, "attribute");
                            copyFlag2 = copyAssociationOrNot(association[j].memberEnd2, "class");
                            if(copyFlag1 != false || copyFlag2 != false){
                                tempData = copyAssociation(associationData, copyFlag1, copyFlag2, association[j])
                                data = data.substring(0, indexEnd) + tempData + data.substring(indexEnd);
                                //addAssociationAttribute(association.memberEnd1, num1, num2);
                                indexEnd += tempData.length;
                            }

                        }
                        break;
                    }
                }

                /*for(var i = 0; i < copyClassId.length; i++){
                    if(associationData.indexOf(copyClassId[i].classId) != -1) {
                        var subscript = associationData.indexOf(copyClassId[i].classId) + copyClassId[i].classId.length;
                        if(associationData[subscript] != " " && associationData[subscript] != "\""){            // full connection association will affect the copyAssociation()
                            break;
                        }
                        addData = "";
                        //tempData = copyAssociation(associationData, copyClassId[i].classId);
                        tempData = copyAssociation(associationData, i);
                        for (var j = 0; j < copyAndSplit.copyNumber[i]; j++) {
                            addData += tempData.replace(/_flag/g, "_Cp" + (j + 1));
                        }
                        data = data.substring(0, indexEnd) + addData + data.substring(indexEnd);
                        indexEnd += addData.length;
                        //var flag = 1;
                        break;
                    }

                    for(var j = 0; j < copyClassId[i].attributeId.length; j++){
                        if(associationData.indexOf(copyClassId[i].attributeId[j]) != -1){
                            addData = "";
                            //tempData = copyAssociation(associationData, copyClassId[i].classId);
                            tempData = copyAssociation(associationData, i);
                            for(var k = 0; k < copyAndSplit.copyNumber[i]; k++){
                                addData += tempData.replace(/_flag/g, "_Cp" + (k + 1));
                            }
                            data = data.substring(0, indexEnd) + addData + data.substring(indexEnd);
                            indexEnd += addData.length;
                            break;
                        }
                    }

                }*/
            }
            //fs.writeFileSync("./project/test.uml", data);

            indexStart = 0;
            indexEnd = 0;
            var attributeData = "";
            var copyData = "";
            var test = 0;
            for(var i = 0; i < copyAssociationId.length; i++){
                indexStart = 0;
                indexEnd = 0;
                while(data.indexOf("<ownedAttribute xmi:type=\"uml:Property\" xmi:id=\"" + copyAssociationId[i].attributeId, indexEnd) != -1){
                    indexStart = data.indexOf("<ownedAttribute xmi:type=\"uml:Property\" xmi:id=\"" + copyAssociationId[i].attributeId, indexEnd);
                    indexStart = data.lastIndexOf("\r\n", indexStart);
                    var bracketLeft = data.indexOf("<", indexStart);
                    var bracketRight;
                    var bracketLast = bracketLeft;
                    var minus = 1;
                    //var reg=new RegExp('</w', 'g');
                    while(minus != 0){
                        bracketLeft = data.indexOf("<", bracketLast + 2);
                        while(data[bracketLeft + 1] == "/"){
                            bracketLeft = data.indexOf("<", bracketLeft + 2);
                        }
                        bracketRight = data.indexOf("/", bracketLast + 2);
                        while(data[bracketRight + 1] != ">" && data[bracketRight - 1] != "<"){
                            bracketRight = data.indexOf("/", bracketRight + 2);
                        }
                        //bracketRight = data.indexOf("/", bracketLast + 1);
                        if(bracketLeft < bracketRight){
                            bracketLast = bracketLeft;
                            minus++;
                        }else if(bracketLeft > bracketRight){
                            bracketLast = bracketRight;
                            minus--;
                        }
                    }
                    indexEnd = data.indexOf(">", bracketRight) + 1;

                    /*indexEnd = data.indexOf("</ownedAttribute>", indexStart);
                    indexEnd += "</ownedAttribute>".length;*/
                    attributeData = data.substring(indexStart, indexEnd);
                    var xmiLoc = attributeData.indexOf("xmi:id=");
                    var quoteLoc = attributeData.indexOf("\"", xmiLoc + 10);
                    var id = attributeData.substring(xmiLoc + "xmi:id=\"".length, quoteLoc);
                    xmiLoc = 0;
                    quoteLoc = 0;
                    while(attributeData.indexOf("xmi:id=\"",quoteLoc) != -1){
                        xmiLoc = attributeData.indexOf("xmi:id=\"",quoteLoc);
                        quoteLoc = attributeData.indexOf("\"",xmiLoc + "xmi:id=\"".length);
                        attributeData = attributeData.substring(0, quoteLoc) + "_flag" + attributeData.substring(quoteLoc);
                    }
                    xmiLoc = 0;
                    quoteLoc = 0;
                    while(attributeData.indexOf("name=\"",quoteLoc) != -1){
                        xmiLoc = attributeData.indexOf("name=\"",quoteLoc);
                        quoteLoc = attributeData.indexOf("\"",xmiLoc + "name=\"".length);
                        attributeData = attributeData.substring(0, quoteLoc) + "_flag" + attributeData.substring(quoteLoc);
                    }
                    xmiLoc = 0;
                    quoteLoc = 0;
                    while(attributeData.indexOf(" type=\"",quoteLoc) != -1){
                        xmiLoc = attributeData.indexOf(" type=\"",quoteLoc);
                        quoteLoc = attributeData.indexOf("\"",xmiLoc + " type=\"".length);
                        attributeData = attributeData.substring(0, quoteLoc) + "_typeflag" + attributeData.substring(quoteLoc);
                    }
                    xmiLoc = 0;
                    quoteLoc = 0;
                    while(attributeData.indexOf("association=\"",quoteLoc) != -1){
                        xmiLoc = attributeData.indexOf("association=\"",quoteLoc);
                        quoteLoc = attributeData.indexOf("\"",xmiLoc + "association=\"".length);
                        attributeData = attributeData.substring(0, quoteLoc) + "_assoflag" + attributeData.substring(quoteLoc);
                    }
                    copyData = "";
                    if(id.split("_Cp").length == 2){
                        for(var j = 0; j <= copyAssociationId[i].num2; j++){
                            var tempData = attributeData;
                            tempData = tempData.replace(/_flag/g, "as" + j);
                            tempData = tempData.replace(/_typeflag/g, "_Cp" + j);
                            tempData = tempData.replace(/_assoflag/g, "_Cp" + id.split("_Cp")[1] + "cp" + j);
                            copyData += tempData;

                        }
                        copyData = copyData.replace(/_Cp0"/g, "\"");
                        data = data.substring(0, indexStart) + copyData + data.substring(indexEnd);
                        indexEnd = copyData.length + indexStart;
                    }else if(id.split("_Cp").length == 1){
                        for(var j = 1; j <= copyAssociationId[i].num2; j++){
                            var tempData = attributeData;
                            tempData = tempData.replace(/_flag/g, "_Cp0as" + j);
                            tempData = tempData.replace(/_typeflag/g, "_Cp" + j);
                            tempData = tempData.replace(/_assoflag/g, "_Cp0cp" + j);
                            copyData += tempData;
                        }
                        copyData = copyData.replace(/_Cp0"/g, "\"");
                        data = data.substring(0, indexEnd) + copyData + data.substring(indexEnd);
                        indexEnd += copyData.length;
                    }else{
                        console.log("something wrong.")
                    }
                    /*if(test < 10){
                     fs.writeFileSync("./project/test" + test + ".uml", data);
                     }*/
                    //indexEnd += copyData.length + indexEnd - indexStart;
                    //console.log("test" + (test++));
                }
            }

            for(var i = 0; i < copyClassId.length; i++){
                for(var j = 0; j < copyClassId[i].attributeId.length; j++){
                    for(var k = 0; k < copyAssociationId.length; k++){
                        if(copyClassId[i].attributeId[j] == copyAssociationId[k].attributeId){
                            copyClassId[i].attributeId.splice(j--, 1);
                            //copyClassId[i].attributeId.remove(copyAssociationId[k].attributeId);
                        }
                    }
                }
            }

            //add openModelProfile
            var indexUmlEnd;
            if(data.indexOf("</uml:Package>") != -1){
                indexUmlEnd = data.indexOf("</uml:Package>") + 14;
            }else if(data.indexOf("</uml:Model>") != -1){
                indexUmlEnd = data.indexOf("</uml:Model>") + 12;
            }else{
                console.warn("Warning :Can not find the tag 'uml:Package' or 'uml:Model' of" + clientFileName + "! Please check out the xml file")
            }
            var openModelProfileData = data.substring(indexUmlEnd);         //openModel_Profile part
            var addData = "";
            var id;
            for(var i = 0; i < copyClassId.length; i++){
                id = copyClassId[i].classId;
                openModelProfileData = addPostfix(openModelProfileData, id, "class", "copy", copyAndSplit.copyNumber[i]);

                for(var j = 0; j < copyClassId[i].attributeId.length; j++){
                    id = copyClassId[i].attributeId[j];
                    //addPostfix("\"" + id + "\"", k + 1);
                    openModelProfileData = addPostfix(openModelProfileData, id, "attribute", "copy", copyAndSplit.copyNumber[i]);
                }
                /*for(var j = 0; j < copyClassId[i].associationId.length; j++){
                    for(var k = 0; k < copyAndSplit.copyNumber[i]; k++){
                        id = copyClassId[i].associationId[j];
                        //addPostfix("\"" + id + "\"", k + 1);
                        openModelProfileData = addPostfix(openModelProfileData, id, k + 1);
                    }
                }*/
                /*for(var j = 0; j < copyClassId[i].fullAssociationId.length; j++){
                    addData += "\r\n  <OpenModel_Profile:OpenModelElement xmi:id=\"" + copyClassId[i].fullAssociationId[j] + "_\" base_Element=\"" + copyClassId[i].fullAssociationId[j] + "\"/>";
                }*/
                /*if(fullAssociationFlag){
                    for(var j = 0; j < copyAndSplit.copyNumber[i]; j++){
                        for(var k = 0; k < copyAndSplit.copyNumber[i]; k++){
                            if(j == k){
                                continue;
                            }
                            var postfix = "_Cp" + j + "as" + k;
                            addData += "\r\n  <OpenModel_Profile:Attribute xmi:id=\"" + copyClassId[i].classId + postfix + "_\" base_Element=\"" + copyClassId[i].classId + postfix + "\"/>";
                        }
                    }
                }*/

            }
            for(var i = 0; i < copyAssociationId.length; i++){
                openModelProfileData = addPostfix(openModelProfileData, copyAssociationId[i].associationId, "association", "copy", copyAssociationId[i].num1, copyAssociationId[i].num2);
                openModelProfileData = addPostfix(openModelProfileData, copyAssociationId[i].attributeId, "addattribute", "copy", copyAssociationId[i].num1, copyAssociationId[i].num2);
            }
            //data = data.substring(0, indexUmlEnd) + addData + data.substring(indexUmlEnd);
            data = data.substring(0, indexUmlEnd) + openModelProfileData;

            //console.log(associationData);
            /*xmlreader.read(associationData, function(error, model) {
                console.log("test;");
            });*/
            console.log("The module of copy class finished.");
        }

        fs.writeFileSync("./project/" + clientFileName, data);
    }catch (e){
        console.log(e.stack);
        throw (e.message);
    }
    /*fs.readFile("./project/" + supplierFileName, "UTF-8", function (err, data) {
        if (err) throw err;
        //console.log(data);
        try{
            fs.writeFile("./project/" + clientFileName,data,function (error) {
                console.log('There is no target file. We clone the source file as target file.');
                if(error){
                    console.log(error.stack);
                    throw(error.message);
                }
            });
        }catch (e){
            console.log(e.stack);
            throw (e.message);
        }
        /!*fs.writeFile("./project/" + clientFileName, data, "UTF-8", function (err) {
            if (err) throw err;
            console.log('There is no target file. We clone the source file as target file.');
        });*!/
    });*/
}

function copyAssociationOrNot(memberEnd, type){
    if(type == "class"){
        for(var i = 0; i < copyClassId.length; i++){
            if(memberEnd == copyClassId[i].classId){
                return copyAndSplit.copyNumber[i];
                break;
            }
        }
        if(i == copyClassId.length){
            return false;
        }
    }
    //var flag = true;
    if(type == "attribute"){
        for(var i = 0; i < copyClassId.length; i++){
            for(var j = 0; j < copyClassId[i].attributeId.length; j++){
                if(memberEnd == copyClassId[i].attributeId[j]){
                    return copyAndSplit.copyNumber[i];
                }
            }
        }
        return false;
    }
}

/*function addAssociationAttribute(data, currentIndex, copyClassIndex){
    var indent = data.indexOf("<") + 2;
    var PRE = "";
    while(indent-- > 0){
        PRE += " ";
    }
    var id = copyClassId[copyClassIndex].classId;
    var name = copyClassId[copyClassIndex].className;
    var length = parseInt(copyAndSplit.copyNumber[copyClassIndex]);

    var tempData = "<ownedAttribute xmi:type=\"uml:Property\" xmi:id=\"" + id + "_Cp" + currentIndex + "as_flag" + "\" name=\"" + name + "_Cp" + currentIndex + "as_flag\" visibility=\"public\" type=\"" + id + "_Cp" + currentIndex + "\" association=\"" + id + "_Cp" + currentIndex + "cp_flag\"/>";
    var addData = "";
    tempData = tempData.replace(/_Cp0"/g, "\"");
    for(var i = 0; i <= length; i++){
        if(i == currentIndex){
            continue;
        }
        addData += "\r\n" + PRE + tempData.replace(/_flag/g, i);
    }
    var insertIndex = data.indexOf("\r\n", data.length - 35);
    data = data.substring(0, insertIndex) + addData + data.substring(insertIndex);
    return data;
}*/

function addPostfix(openModelProfileData, id, type, copyOrSplit, count1, count2){
    var index = 0;
    var indexId = 0;
    var indexLineEnd = 0;
    var indexLineStart = 0;
    var lineData = "";
    var addData = "";
    var postfix = "";
    if(copyOrSplit == "copy"){
        postfix = "_Cp";
    }else if(copyOrSplit == "split"){
        postfix = "_Sp";
    }
    while(openModelProfileData.indexOf(id, index) != -1){
        indexId = openModelProfileData.indexOf(id, index);
        indexLineEnd = openModelProfileData.indexOf("\r\n", indexId);
        indexLineStart = openModelProfileData.lastIndexOf("\r\n", indexId);
        /*if(indexId < 160){
            indexLineStart = 0;
        }else{
            indexLineStart = openModelProfileData.indexOf("\r\n", indexId - 160);
        }*/
        lineData = openModelProfileData.substring(indexLineStart, indexLineEnd);
        var lineDataArray = lineData.split("\"");
        lineDataArray[1] += "_flag";
        lineDataArray[3] += "_flag";
        if(lineDataArray[5] != undefined && lineDataArray[5] == id){
            lineDataArray[5] += "_flag";
        }
        //test++;
        addData = "";
        lineData = lineDataArray.join("\"");
        if(type == "class" || type == "attribute"){
            for(var i = 1; i <= count1; i++){
                addData += lineData.replace(/_flag/g, postfix + i);
            }
        }else if(type == "association"){
            for(var i = 0; i <= count1; i++){
                for(var j = 0; j <= count2; j++){
                    if(i == 0 && j == 0){
                        continue;
                    }
                    addData += lineData.replace(/_flag/g, postfix + i + "cp" + j);
                }
            }
        }else if(type == "addattribute"){
            for(var i = 0; i <= count1; i++){
                for(var j = 0; j <= count2; j++){
                    if(i == 0 && j == 0){
                        continue;
                    }
                    addData += lineData.replace(/_flag/g, postfix + i + "as" + j);
                }
            }
        }

        openModelProfileData = openModelProfileData.substring(0, indexLineEnd) + addData + openModelProfileData.substring(indexLineEnd);
        //addData += lineData;
        index = indexLineEnd + addData.length;
    }
    return openModelProfileData;

}

/*function fullConnectionAssociation(copyclassid, copyNumber, indent){
    var associationData = "\r\n";
    var postfix = "";
    var postfixTemp = "";
    var postfix1 = "";
    var postfix2 = "";
    var PRE = "";
    while(indent > 0){
        PRE += " ";
        indent--;
    }
    for(var i = 0; i <= copyNumber; i++){
        for(var j = 0; j <= copyNumber; j++){
            if(i == j){
                continue;
            }
            postfix = "_Cp" + i + "cp" + j;
            if(j == 0){
                postfixTemp = "";
            }else{
                postfixTemp = "_Cp" + j;
            }
            postfix1 = "_Cp" + i + "as" + j;
            postfix2 = "_as" + i + "cp" + j;
            associationData += "<packagedElement xmi:type=\"uml:Association\" xmi:id=\"" + copyclassid.classId + postfix + "\" name=\"" + copyclassid.className + postfix + "\" memberEnd=\""+ copyclassid.classId + postfix1 + " " + copyclassid.classId + postfix2 + "\">\r\n";
            associationData += "  <eAnnotations xmi:type=\"ecore:EAnnotation\" xmi:id=\"" + copyclassid.classId + postfix + "_\" source=\"http://www.eclipse.org/uml2/2.0.0/UML\">\r\n";
            associationData += "    <details xmi:type=\"ecore:EStringToStringMapEntry\" xmi:id=\"" + copyclassid.classId + postfix + "-\" key=\"names\"/>\r\n";
            associationData += "  </eAnnotations>\r\n";
            associationData += "  <ownedEnd xmi:type=\"uml:Property\" xmi:id=\"" + copyclassid.classId + postfix2 + "\" name=\"" + copyclassid.className + postfix2 + "\" visibility=\"private\" type=\"" + copyclassid.classId + postfixTemp + "\" association=\"" + copyclassid.classId + postfix + "\">\r\n";
            /!*if(i == 0){
                associationData += "  <ownedEnd xmi:type=\"uml:Property\" xmi:id=\"" + copyclassid.classId + postfix2 + "\" name=\"" + copyclassid.className + postfix2 + "\" visibility=\"private\" type=\"" + copyclassid.classId +  "\" association=\"" + copyclassid.classId + postfix + "\">\r\n";
            }else{
                associationData += "  <ownedEnd xmi:type=\"uml:Property\" xmi:id=\"" + copyclassid.classId + postfix2 + "\" name=\"" + copyclassid.className + postfix2 + "\" visibility=\"private\" type=\"" + copyclassid.classId + "_Cp" + j + "\" association=\"" + copyclassid.classId + postfix + "\">\r\n";
            }*!/
            associationData += "    <lowerValue xmi:type=\"uml:LiteralInteger\" xmi:id=\"" + copyclassid.classId + postfix2 + "_\"/>\r\n";
            associationData += "    <upperValue xmi:type=\"uml:LiteralUnlimitedNatural\" xmi:id=\"" + copyclassid.classId + postfix2 + "-\" value=\"1\"/>\r\n";
            associationData += "  </ownedEnd>\r\n";
            /!*associationData += "  <ownedEnd xmi:type=\"uml:Property\" xmi:id=\"" + copyclassid.classId + postfix2 + "\" name=\"" + copyclassid.className + postfix2 + "\" visibility=\"private\" type=\"" + copyclassid.classId + "_Cp" + j + "\" association=\"" + copyclassid.classId + postfix + "\">\r\n";
            associationData += "    <lowerValue xmi:type=\"uml:LiteralInteger\" xmi:id=\"" + copyclassid.classId + postfix2 + "_\"/>\r\n";
            associationData += "    <upperValue xmi:type=\"uml:LiteralUnlimitedNatural\" xmi:id=\"" + copyclassid.classId + postfix2 + "__\" value=\"1\"/>\r\n";
            associationData += "  </ownedEnd>\r\n";*!/
            associationData += "</packagedElement>\r\n";
        }
    }
    associationData = associationData.replace(/\r\n$/g, "");
    associationData = associationData.replace(/\r\n/g, "\r\n" + PRE);
    return associationData;
}*/
//var count = 0;
function copyAssociation(associationData, flag1, flag2, association) {
    var num1 = flag1;
    var num2 = flag2;
    var returnData = "";
    if(flag1 == false){
        num1 = 0;
    }
    if(flag2 == false){
        num2 = 0;
    }
    var xmiLoc = 0;
    var quoteLoc = 0;
    while(associationData.indexOf("name=\"",quoteLoc) != -1){         //add "_Cp" postfix
        xmiLoc = associationData.indexOf("name=\"",quoteLoc);
        quoteLoc = associationData.indexOf("\"",xmiLoc + 6);
        //tempData = associationData.substring(0, quoteLoc) + "_flag" + associationData.substring(quoteLoc);
        associationData = associationData.substring(0, quoteLoc) + "_flag" + associationData.substring(quoteLoc);

    }
    xmiLoc = 0;
    quoteLoc = 0;
    while(associationData.indexOf(" association=\"",quoteLoc) != -1){         //add "_Cp" postfix
        xmiLoc = associationData.indexOf(" association=\"",quoteLoc);
        quoteLoc = associationData.indexOf("\"",xmiLoc + 16);
        // tempData = associationData.substring(0, quoteLoc) + "_flag" + associationData.substring(quoteLoc);
        associationData = associationData.substring(0, quoteLoc) + "_flag" + associationData.substring(quoteLoc);

    }
    xmiLoc = 0;
    quoteLoc = 0;
    while(associationData.indexOf("xmi:id=\"",quoteLoc) != -1){         //add "_Cp" postfix
        xmiLoc = associationData.indexOf("xmi:id=\"",quoteLoc);
        quoteLoc = associationData.indexOf("\"",xmiLoc + 10);
        // tempData = associationData.substring(0, quoteLoc) + "_flag" + associationData.substring(quoteLoc);
        associationData = associationData.substring(0, quoteLoc) + "_flag" + associationData.substring(quoteLoc);
    }
    xmiLoc = 0;
    quoteLoc = 0;
    while(associationData.indexOf(" type=\"",quoteLoc) != -1){         //add "_Cp" postfix
        xmiLoc = associationData.indexOf(" type=\"",quoteLoc);
        quoteLoc = associationData.indexOf("\"",xmiLoc + 7);
        associationData = associationData.substring(0, quoteLoc) + "_class" + associationData.substring(quoteLoc);
    }
    xmiLoc = 0;
    quoteLoc = 0;
    var memberEnd = [];
    xmiLoc = associationData.indexOf("memberEnd=\"",quoteLoc);
    quoteLoc = associationData.indexOf("\"",xmiLoc + 12);
    memberEnd = associationData.substring(xmiLoc + 11, quoteLoc).split(" ");
    if(memberEnd[0] == association.memberEnd1){
        associationData = associationData.replace(memberEnd[1], memberEnd[1] + "_flag");
    }else{
        associationData = associationData.replace(memberEnd[0], memberEnd[0] + "_flag");
    }
    associationData = associationData.replace(association.memberEnd1, association.memberEnd1 + "_attribute");
    //associationData = associationData.replace(association.memberEnd2, association.memberEnd2 + "_class");
    var tempData = "";
    var test = 0
    for(var i = 0; i < num1 + 1; i++){
        for(var j = 0; j < num2 + 1; j++){
            if(i == 0 && j == 0){
                continue;
            }
            tempData = associationData;
            tempData = tempData.replace(/_flag/g, "_Cp" + i + "cp" + j);
            tempData = tempData.replace(/_attribute/g, "_Cp" + i + "as" + j);
            tempData = tempData.replace(/_class/g, "_Cp" + i);
            tempData = tempData.replace(/_Cp0 /g, " ");
            tempData = tempData.replace(/_Cp0"/g, "\"");
            //tempData = tempData.replace(new RegExp("_Cp" + i + "cp" + j + "_", 'g'), "_Cp" + i + "cp" + j);
            //console.log(test++);
            returnData += tempData;
        }
    }
    /*var copyattributeid = {};
    copyattributeid.attributeId = association.memberEnd1;
    copyattributeid.num1 = num1;
    copyattributeid.num2 = num2;
    copyAssociationId.push(copyattributeid);*/
    var copyassociationid = {};
    copyassociationid.associationId = association.id;
    copyassociationid.attributeId = association.memberEnd1;
    copyassociationid.num1 = num1;
    copyassociationid.num2 = num2;
    copyAssociationId.push(copyassociationid);

    return returnData;
}

function splitClass(){
    var data = fs.readFileSync("./project/" + clientFileName, {encoding: 'utf8'});
    try{
        if(fs.existsSync("./project/CopyAndSplit.txt")) {
            if(copyAndSplit.splitClass == null){
                return;
            }
            if (data.indexOf(copyAndSplit.splitClass[0] + "_Sp") != -1) {
                //console.log(" ");
                return;
                fs.writeFileSync("./project/" + clientFileName, data);
            }
            for(var i = 0; i < copyAndSplit.splitClass.length; i++) {
                var reg = new RegExp('\\s+<packagedElement xmi:type="uml:Class".*' + copyAndSplit.splitClass[i] + '"[\\s\\S]*?</packagedElement>');
                if(data.match(reg) == null){
                    console.warn("Warning: There is no class named \"" + copyAndSplit.splitClass[i] + "\" in " + clientFileName + ". Please recheck your input file and CopyAndSplit file!")
                    throw (e);
                }
                var originData = data.match(reg)[0];
                var splitclassid = {};
                xmlreader.read(originData, function (error, model) {
                    if (error) {
                        console.log('There was a problem reading data from ' + clientFileName + '. Please check your xmlreader module and nodejs!\t\n' + error.stack);
                    } else {
                        if (model.packagedElement.attributes()["xmi:type"] == "uml:Class") {
                            splitclassid.classId = model.packagedElement.attributes()["xmi:id"];
                            splitclassid.className = copyAndSplit.splitClass[i];
                            splitclassid.attributeId = [];
                            if (model.packagedElement.ownedAttribute) {
                                model.packagedElement.ownedAttribute.array ? lenAttribute = model.packagedElement.ownedAttribute.array.length : lenAttribute = 1;
                                for (var k = 0; k < lenAttribute; k++) {
                                    lenAttribute == 1 ? obj = model.packagedElement.ownedAttribute : obj = model.packagedElement.ownedAttribute.array[k];
                                    splitclassid.attributeId.push(obj.attributes()["xmi:id"]);
                                }
                            }
                            splitClassId.push(splitclassid);
                            //console.log(splitclassid);
                        }
                    }
                });
                var prefix = originData.indexOf("<") - 2;
                var PRE = "";
                while (prefix > 0) {
                    PRE += " ";
                    prefix--;
                }
                var splitData = "";
                var addData = "";
                var tempData = "";
                var addAttributeData = "";
                var name = splitclassid.className;
                if(name[0].search(new RegExp("[A-Z]")) != -1){
                    name = "_" + name[0].toLowerCase() + name.substring(1);
                }else{
                    console.warn("Warning :The name of xmi:id=\"" + splitclassid.classId + "\" is invalid. Please recheck your files.");
                }
                //if(name[])
                var attributeData = '\r\n' + PRE + '  <ownedAttribute xmi:type="uml:Property" xmi:id="' + splitclassid.classId + '_flag1flag2" name="' + name + '_flag1flag2" type="' + splitclassid.classId + '_flag3">';
                attributeData += "\r\n" + PRE + '    <lowerValue xmi:type="uml:LiteralInteger" xmi:id="' + splitclassid.classId + '_flag1flag2_"/>';
                attributeData += "\r\n" + PRE + '    <upperValue xmi:type="uml:LiteralUnlimitedNatural" xmi:id="' + splitclassid.classId + '_flag1flag2-" value="1"/>';
                attributeData += '\r\n' + PRE + '  </ownedAttribute>';

                reg = new RegExp("\\s+<ownedAttribute");
                var insertIndex = originData.search(reg);
                for (var j = 1; j <= copyAndSplit.splitNumber[i]; j++) {
                    addAttributeData = attributeData;
                    addAttributeData = addAttributeData.replace(/flag1/g, "Sp0");
                    addAttributeData = addAttributeData.replace(/flag2/g, "as" + j);
                    addAttributeData = addAttributeData.replace(/flag3/g, "Sp" + j);
                    addAttributeData = addAttributeData.replace(/_Sp0"/g, "\"");
                    tempData += addAttributeData;
                }
                addData += originData.substring(0, insertIndex) + tempData + originData.substring(insertIndex);


                reg = new RegExp('<packagedElement xmi:type=\"uml:Class\".*xmi:id=\"' + splitclassid.classId + '\"[\\s\\S]*?>');
                splitData = "\r\n" + originData.match(reg)[0] + "\r\n</packagedElement>";
                splitData = splitData.replace(/\r\n/g, "\r\n" + PRE);
                splitData = splitData.replace(splitclassid.classId, splitclassid.classId + "_flag");
                splitData = splitData.replace(splitclassid.className, splitclassid.className + "_flag");

                for (var j = 1; j <= copyAndSplit.splitNumber[i]; j++) {
                    tempData = "";
                    addAttributeData = ""
                    for (var k = j + 1; k <= copyAndSplit.splitNumber[i]; k++) {
                        addAttributeData += attributeData;
                        addAttributeData = addAttributeData.replace(/flag1/g, "Sp" + j);
                        addAttributeData = addAttributeData.replace(/flag2/g, "as" + k);
                        addAttributeData = addAttributeData.replace(/flag3/g, "Sp" + k);
                    }
                    tempData += splitData.substring(0, splitData.indexOf("\r\n", 1)) + addAttributeData + splitData.substring(splitData.indexOf("\r\n", 1));
                    //tempData = tempData.replace(/\r\n/g, "\r\n" + PRE);
                    tempData = tempData.replace(/_flag/g, "_Sp" + j);
                    addData += tempData;
                }
                data = data.replace(originData, addData);

                //add association
                insertIndex = data.indexOf(addData) + addData.length;
                var name =
                originData = "";
                originData += "\r\n<packagedElement xmi:type=\"uml:Association\" xmi:id=\"" + splitclassid.classId + "_flag1flag2\" name=\"" + copyAndSplit.splitClass[i] + "_flag1flag2\" memberEnd=\"" + splitclassid.classId + "_flag1flag2_ " + splitclassid.classId + "_flag1flag3\">"
                originData += "\r\n\t<eAnnotations xmi:type=\"ecore:EAnnotation\" xmi:id=\"" + splitclassid.classId + "_flag1flag2-\" source=\"http://www.eclipse.org/uml2/2.0.0/UML\">";
                originData += "\r\n\t\t<details xmi:type=\"ecore:EStringToStringMapEntry\" xmi:id=\"" + splitclassid.classId + "_flag1flag2--\" key=\"names\"/>";
                originData += "\r\n\t</eAnnotations>";
                originData += "\r\n\t<ownedEnd xmi:type=\"uml:Property\" xmi:id=\"" + splitclassid.classId + "_flag1flag2_\" name=\"" + copyAndSplit.splitClass[i] + "_-flag1flag2\" visibility=\"private\" type=\"" + splitclassid.classId + "_flag1\" association=\"" + splitclassid.classId + "_flag1flag2\">";
                originData += "\r\n\t\t<lowerValue xmi:type=\"uml:LiteralInteger\" xmi:id=\"" + splitclassid.classId + "_flag1flag2.\"/>";
                originData += "\r\n\t\t<upperValue xmi:type=\"uml:LiteralUnlimitedNatural\" xmi:id=\"" + splitclassid.classId + "_flag1flag2..\" value=\"1\"/>";
                originData += "\r\n\t</ownedEnd>";
                originData += "\r\n</packagedElement>";
                addData = "";
                for (var j = 0; j <= copyAndSplit.splitNumber[i]; j++) {
                    for (var k = j + 1; k <= copyAndSplit.splitNumber[i]; k++) {
                        addData += originData;
                        addData = addData.replace(/flag1/g, "Sp" + j);
                        addData = addData.replace(/flag2/g, "sp" + k);
                        addData = addData.replace(/flag3/g, "as" + k);
                    }
                }
                addData = addData.replace(/\r\n/g, "\r\n" + PRE);
                addData = addData.replace(/_Sp0"/g, "\"");
                data = data.substring(0, insertIndex) + addData + data.substring(insertIndex);
            }
                //add openModelProfile
            var indexUmlEnd;
            if(data.indexOf("</uml:Package>") != -1){
                indexUmlEnd = data.indexOf("</uml:Package>") + 14;
            }else if(data.indexOf("</uml:Model>") != -1){
                indexUmlEnd = data.indexOf("</uml:Model>") + 12;
            }else{
                console.warn("Warning :Can not find the tag 'uml:Package' or 'uml:Model' of" + clientFileName + "! Please check out the xml file")
            }
            var openModelProfileData = data.substring(indexUmlEnd);         //openModel_Profile part
            var addData = "";
            var id;
            var indexId;
            var insertIndex;
            var lineData = "";
            var lineAttributeData = "\r\n  <OpenModel_Profile:OpenModelAttribute xmi:id=\"classId-_flag1flag2\" base_StructuralFeature=\"classId_flag1flag2\"/>";
            var lineAssociationData = "\r\n  <OpenModel_Profile:OpenModelElement xmi:id=\"classId-_flag1flag2\" base_Element=\"classId_flag1flag2\"/>";
            for(var i = 0; i < splitClassId.length; i++) {
                id = splitClassId[i].classId;
                openModelProfileData = addPostfix(openModelProfileData, id, "class", "split", copyAndSplit.splitNumber[i]);
                indexId = openModelProfileData.lastIndexOf(id);
                insertIndex = openModelProfileData.indexOf("\r\n", indexId);
                lineData = "";
                for(var j = 0; j < copyAndSplit.splitNumber[i]; j++){
                    for(var k = j + 1; k <= copyAndSplit.splitNumber[i]; k++){
                        lineData += lineAttributeData;
                        lineData = lineData.replace(/flag1/g, "Sp" + j);
                        lineData = lineData.replace(/flag2/g, "as" + k);
                    }
                }
                for(var j = 0; j < copyAndSplit.splitNumber[i]; j++){
                    for(var k = j + 1; k <= copyAndSplit.splitNumber[i]; k++){
                        lineData += lineAssociationData;
                        lineData = lineData.replace(/flag1/g, "Sp" + j);
                        lineData = lineData.replace(/flag2/g, "sp" + k);
                    }
                }
                lineData = lineData.replace(/classId/g, id);
                openModelProfileData = openModelProfileData.substring(0, insertIndex) + lineData + openModelProfileData.substring(insertIndex);
            }
            data = data.substring(0, indexUmlEnd) + openModelProfileData;
            fs.writeFileSync("./project/" + clientFileName, data);
        }
    }catch (e){
        console.log(e.stack);
        throw (e.message);
    }
}

var pflag;
function addPath(Class){
    var path,
        temp;
    var id = Class.id;
    for(var i = 0; i < isInstantiated.length; i++){
        if(id == isInstantiated[i].id && Class.fileName == isInstantiated.fileName){
            if(isInstantiated[i].tpath){
                path = isInstantiated[i].tpath;
                return path;
            }else{
                if(isInstantiated[i].pnode == pflag){
                    console.warn("Warning:xmi:id=" + pflag + " and xmi:id=" + isInstantiated[i].id + " have been found cross composite!");
                    return path;
                }
                path = isInstantiated[i].path;
                temp = addPath(isInstantiated[i].pnode);
                if(temp !== undefined){
                    path = path.split("/")[1];
                    path = temp + '/' + path;
                    return path;
                }else{
                    isInstantiated[i].tpath = path;
                    return path;
                }
            }
        }
    }
    if(i == isInstantiated.length){
        return path;
    }
}

function addKey(){
    for(var i = 0; i < Class.length; i++){
        var flag = 0;
        //search every class,if class's generalization's value is keylist's id,the class will have a key
        if (Class[i].generalization.length !== 0) {
            for(var j = 0; j < Class[i].generalization.length; j++){
                for(var k = 0; k < Class.length; k++){
                    if(Class[k].id == Class[i].generalization[j] && Class[k].fileName == Class[i].fileName){
                        if(Class[k].isAbstract && Class[k].key.length !== 0){
                            //Array.prototype.push.apply(Class[i].key, Class[k].key);
                            Class[i].key = Class[i].key.concat(Class[k].key);
                        }
                        break;
                    }
                }
            }
        }
        if(Class[i].key.length > 0){
            Class[i].key = Class[i].key.join(" ");
        }
        //if(flag == 0 && Class[i].config){
          //  Class[i].key = "localId";
        //}
       /*for(var j = 0; j < keylist.length; j++){
           if(keylist[j].id == Class[i+].name){
               Class[i].key = keylist[j].name;
               break;
           }
       }*/
    }
}

function createKey(cb){
    /*var p_path = process.cwd();
    fs.exists(p_path + "/project/key.cfg", function(flag){
        if(flag){
            var obj = fs.readFileSync("./project/key.cfg", {encoding: 'utf8'});
            obj = eval('(' + (obj) + ')');
            for(var i = 0; i < obj.length; i++){
                var name = obj[i].name;
                name = name.replace(/^[^A-Za-z]+|[^A-Za-z\d]+$/g, "");
                name = name.replace(/[^\w]+/g, '_');
                var k = new key(name, obj[i].key);
                //keyId.push(k);
                keylist.push(k);
            }
            cb(true);
        }
        else{
            cb(false);
        }
    });
    */
    cb(true);
}

function parseModule(fileName){                     //XMLREADER read xml files
    var xml = fs.readFileSync("./project/" + fileName, {encoding: 'utf8'});
    if(xml[xml.indexOf("\n") - 1] != "\r"){       // Line end with "\n" in Linux, we replace all "\n" to "\r\n"
        //xml = xml.replace(/\n/g,"\r\n");
        xml = xml.replace(new RegExp('[^\\r]\n'), "\r\n");
    }
    //fs.writeFileSync("./project/" + fileName, xml);
    xmlreader.read(xml, function(error, model) {
        if (error) {
            console.log('There was a problem reading data from ' + fileName + '. Please check your xmlreader module and nodejs!\t\n' + error.stack);
        } else {
            console.log(fileName + " read successfully!");
            var xmi;
            var flag = 0;
            var newxmi;
            if(model["xmi:XMI"]){                   //model stores what XMLREADER read
                xmi = model["xmi:XMI"] ;            //xmi:the content of xmi:XMI object in model
                var obj;
                for(var key in xmi){                            //key:the child node of xmi
                    switch(key.split(":")[1]){
                        case "OpenModelAttribute":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];      //newxmi: the array in OpenModel_Profile:OpenModelAttribute
                            var len = xmi[key].array ? xmi[key].array.length : 1;     //OpenModel_Profile:the number of array object in OpenModelAttribute
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                parseOpenModelatt(obj);
                            }
                            break;
                        case "OpenModelClass":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                parseOpenModelclass(obj);
                            }
                            break;
                        case "OpenModelParameter":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                parseOpenModelatt(obj);
                            }
                            break;
                        case "Preliminary":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj=newxmi[i];
                                //createLifecycle(obj, "current");
                                createLifecycle(obj, "Preliminary");

                            }
                            break;
                        case "Mature":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                createLifecycle(obj, "current");
                            }
                            break;
                        case "Obsolete":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                createLifecycle(obj, "obsolete");
                            }
                            break;
                        case "Deprecated":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                createLifecycle(obj, "deprecated");
                            }
                            break;
                        case "Experimental":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                //createLifecycle(obj, "deprecated");
                                createLifecycle(obj, "Experimental");
                            }
                            break;
                        case "Example":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                createLifecycle(obj, "Example");
                            }
                            break;
                        case "LikelyToChange":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                //createLifecycle(obj, "deprecated");
                                createLifecycle(obj, "LikelyToChange");
                            }
                            break;
                        case "PassedByReference":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                if(obj.attributes()["passedByRef"] == "false"){
                                    obj.psBR = false;
                                }else{
                                    obj.psBR = true;
                                }
                                parseOpenModelatt(obj);
                            }
                            break;
                        case "PruneAndRefactor":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i= 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                parseOpenModelpandr(obj);
                            }
                            break;
                        case "Merge":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i= 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                parseMerge(obj);
                            }
                            break;
                        case "Use":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i= 0; i < len; i++){
                                len == 1 ? obj = newxmi : obj = newxmi[i];
                                parseUse(obj);
                            }
                            break;

                        default :break;
                    }
                }
                for(var key in xmi){
                    switch(key){
                        case "uml:Package":
                            flag = 1;
                            newxmi = xmi[key];                //newxmi:xmi["uml:package"]
                            parseUmlModel(newxmi);          //parse umlModel
                            break;
                        case "uml:Model":
                            flag = 1;
                            newxmi = xmi[key];
                            parseUmlModel(newxmi);
                            break;
                        default :break;
                    }
                }
                if(flag == 0){
                    console.log("Can not find the tag 'uml:Package' or 'uml:Model' of" + filename + "! Please check out the xml file")
                }
            }
            else{
                if (model["uml:Package"] || model["uml:Model"]) {
                    flag = 1;
                    if(model["uml:Package"]){
                        newxmi = model["uml:Package"];
                    }
                    if(model["uml:Model"]){
                        newxmi = model["uml:Model"];
                    }
                    parseUmlModel(newxmi);
                }
                else{
                    console.log("empty file!");
                }
            }
            console.log("Parse " + fileName + " successfully!");
            return;
        }
    });
}

function parseUmlModel(xmi){                    //parse umlmodel
    var mainmod;
    var comment = "";
    xmi.attributes().name ? mainmod = xmi.attributes().name : console.error("ERROR:The attribute 'name' of tag 'xmi:id=" + xmi.attributes()["xmi:id"] + "' in " + filename + " is empty!");
    mainmod = mainmod.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9\d]+$/g, "");   //remove the special character in the end
    mainmod = mainmod.replace(/[^\w\.-]+/g, '_');                     //not "A-Za-z0-9"->"_"
    modName.push(mainmod);
    if (xmi["ownedComment"]) {
        comment = parseComment(xmi);
        /*if(xmi['ownedComment'].array){
            //comment += xmi['ownedComment'].array[0].body.text();
            for(var j = 0; j < xmi['ownedComment'].array.length; j++){
                if(xmi['ownedComment'].array[j].body.hasOwnProperty("text")){
                    comment += xmi['ownedComment'].array[j].body.text() + "\r\n";
                }
            }
            comment = comment.replace(/\r\n$/g, "");
        }else if(xmi['ownedComment'].body){
            comment = xmi['ownedComment'].body.text();
        }*/
    }
    //var namespace = "urn:onf:params:xml:ns:yang:" + modName.join("-");
    var namespace = "";
    namespace = config.namespace + modName.join("-");
    var prefix;
    if(config.prefix == "" || config.prefix == null){
        prefix = modName.join("-");
    }else{
        prefix = config.prefix;
    }
    var m = new Module(modName.join("-"), namespace, "", prefix, config.organization, config.contact, config.revision, comment, currentFileName);
    modName.pop();
    //createElement(xmi);//create object class
    var newxmi;
    var len;
    if(xmi.packagedElement){
        xmi.packagedElement.array ? len = xmi.packagedElement.array.length : len = 1;
    }
    for(var i = 0; i < len; i++){
        len == 1 ? newxmi =xmi.packagedElement : newxmi = xmi.packagedElement.array[i];
        if(newxmi.attributes().name == "Imports"){
            var impLen;
            var impObj;
            var imp;
            newxmi.packageImport.array ? impLen = newxmi.packageImport.array.length : impLen = 1;
            for(var j = 0; j < impLen; j++){
                impLen == 1 ? impObj = newxmi.packageImport : impObj = newxmi.packageImport.array[j];
                imp = impObj.importedPackage.attributes().href.split('/').pop().split('.')[0];
                m.import.push(imp);
            }
            //m.import.push(newxmi.packageImport.importedPackage.attributes().href);
        }
        parsePackage(newxmi);

    }
    yangModule.push(m);
    modName.pop();
}

function parsePackage(xmi){
    var len;
    var newxmi;
    var mainmod;
    var id = xmi.attributes()["xmi:id"];
    var comment = "";
    if(xmi.attributes()["xmi:type"] == "uml:Package" || xmi.attributes()["xmi:type"] == "uml:Interface") {
        xmi.attributes().name?mainmod=xmi.attributes().name:console.error("ERROR:The attribute 'name' of tag 'xmi:id=" + xmi.attributes()["xmi:id"] + "' in " + filename + " is empty!");
        mainmod=mainmod.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9\d]+$/g, "");   //remove the special character in the end
        mainmod=mainmod.replace(/[^\w\.-]+/g, '_');                     //not "A-Za-z0-9"->"_"
        if (xmi["ownedComment"]) {
            comment = parseComment(xmi);
            /*if(xmi['ownedComment'].array){
                comment += xmi['ownedComment'].array[0].body.text();
                for(var j = 1; j<xmi['ownedComment'].array.length; j++){
                    if(xmi['ownedComment'].array[j].body.hasOwnProperty("text")){
                        comment += "\r\n" + xmi['ownedComment'].array[j].body.text();
                    }
                }
            }else if(xmi['ownedComment'].body){
                comment = xmi['ownedComment'].body.text();
            }*/
        }
        var temp = new Package(mainmod, id, modName.join("-"), comment, currentFileName);
        packages.push(temp);
        modName.push(mainmod);

        if(xmi.packagedElement){
            xmi.packagedElement.array ? len = xmi.packagedElement.array.length : len = 1;
        }
        for(var i = 0; i < len; i++){
            len == 1 ? newxmi = xmi.packagedElement : newxmi = xmi.packagedElement.array[i];
            parsePackage(newxmi);
        }
        modName.pop();
        if(xmi.attributes()["xmi:type"] == "uml:Interface"){
            xmi.ownedOperation.array ? len = xmi.ownedOperation.array.length : len = 1;
            for(var i = 0; i < len; i++){
                len == 1 ? newxmi = xmi.ownedOperation : newxmi = xmi.ownedOperation.array[i];
                createClass(newxmi, "rpc");
            }
        }

    }else{
        createElement(xmi);
    }
}

function parseOpenModelatt(xmi){
    var flag = 0;
    var id;
    if(xmi.attributes()["base_StructuralFeature"]){
        id = xmi.attributes()["base_StructuralFeature"]
    }else if(xmi.attributes()["base_Parameter"]){
        id = xmi.attributes()["base_Parameter"]
    }
    else{
        return;
    }
    var cond;
    var sup;
    if(xmi.attributes()["condition"] && xmi.attributes()["condition"] != "none"){
        cond = xmi.attributes()["condition"];
        if(xmi.attributes()["support"]){
            sup = xmi.attributes()["support"];
            flag = 1;
        }
        flag = 1;
    }
    var passBR;
    if(xmi.psBR == false || xmi.psBR == true){
        passBR = xmi.psBR;
        flag = 1;
    }
    var vr;
    //if(xmi.attributes()["valueRange"]&&xmi.attributes()["valueRange"]!="NA"&&xmi.attributes()["valueRange"]!="See data type"){
    if(xmi.attributes()["valueRange"] && xmi.attributes()["valueRange"] != "null" && xmi.attributes()["valueRange"] != "NA" && xmi.attributes()["valueRange"] != "See data type" && xmi.attributes()["valueRange"] != "See data type."){

        vr = xmi.attributes()["valueRange"];
        flag = 1;
    }
    var units;
    if(xmi.attributes()["unit"]){
        units = xmi.attributes()["unit"];
        flag = 1;
    }
    var key;
    if(xmi.attributes()["partOfObjectKey"] && xmi.attributes()["partOfObjectKey"] != "0"){
        flag = 1;
        key = xmi.attributes()["partOfObjectKey"];
    }
    var inv;
    if(xmi.attributes()["isInvariant"]){
        inv = xmi.attributes()["isInvariant"];
        flag = 1;
    }
    var avcNot;
    if(xmi.attributes()["attributeValueChangeNotification"]){
        avcNot = xmi.attributes()["attributeValueChangeNotification"];
        flag = 1;
    }
    if(flag == 0){
        return;
    }else{
        for(var i = 0; i < openModelAtt.length; i++){
            if(openModelAtt[i].id == id && openModelAtt[i].fileName == currentFileName){
                sup !== undefined ? openModelAtt[i].support = sup : null;
                cond !== undefined ? openModelAtt[i].condition = cond : null;
                vr !== undefined ? openModelAtt[i].valueRange = vr : null;
                inv !== undefined ? openModelAtt[i].isInvariant = inv : null;
                avcNot !== undefined ? openModelAtt[i].attributeValueChangeNotification = avcNot : null;
                key !== undefined ? openModelAtt[i].key = key : null;
                units !== undefined ? openModelAtt[i].units = units : null;
            }
        }
        if(i == openModelAtt.length){
            var att = new OpenModelObject(id, "attribute", vr, cond, sup, inv, avcNot, undefined, undefined, passBR, undefined, undefined, undefined, key, units, currentFileName);
            openModelAtt.push(att);
        }
    }
}

function parseOpenModelclass(xmi){
    var flag = 0;
    var id;
    if(xmi.attributes()["base_Class"]){
        id = xmi.attributes()["base_Class"]
    } else if(xmi.attributes()["base_Operation"]){
        id = xmi.attributes()["base_Operation"];

    }
    else{
        return;
    }
    var cond,
        sup,
        opex,
        opid,
        ato;
    if(xmi.attributes()["operation exceptions"]){
        opex = true;
        flag = 1;
    }
    if(xmi.attributes()["isOperationIdempotent"]){
        opid = true;
        flag = 1;
    }
    if(xmi.attributes()["isAtomic"]){
        ato = true;
        flag = 1;
    }
    if(xmi.attributes()["condition"] && xmi.attributes()["condition"]!="none"){
        cond = xmi.attributes()["condition"];
        if(xmi.attributes()["support"]){
            sup = xmi.attributes()["support"];
        }
        flag = 1;
    }
    var cNot;
    if(xmi.attributes()["objectCreationNotification"]){
        cNot = xmi.attributes()["objectCreationNotification"];
        flag = 1;
    }
    var dNot;
    if(xmi.attributes()["objectDeletionNotification"]){
        dNot = xmi.attributes()["objectDeletionNotification"];
        flag = 1;
    }
    if(flag == 0){
        return;
    }else{
        for(var i = 0; i < openModelclass.length; i++){
            if(openModelclass[i].id == id && openModelclass[i].fileName == currentFileName){
                sup !== undefined ? openModelclass[i].support = sup : null;
                cond !== undefined ? openModelclass[i].condition = cond : null;
                cNot !== undefined ? openModelclass[i]["objectCreationNotification"] = cNot : null;
                dNot !== undefined ? openModelclass[i]["objectDeletionNotification"] = dNot : null;
            }
        }
        if(i == openModelclass.length){
            var att = new OpenModelObject(id, "class", undefined, cond, sup, undefined, undefined, dNot, cNot, undefined, undefined, undefined, undefined, undefined, undefined, currentFileName);
            openModelclass.push(att);
        }
    }
}

function createLifecycle(xmi,str){              //创建lifecycle
    var id;
    var nodetype;
    if(xmi.attributes()["base_Parameter"]){
        id = xmi.attributes()["base_Parameter"];
        nodetype = "attribute";
    }else if(xmi.attributes()["base_StructuralFeature"]){
        id = xmi.attributes()["base_StructuralFeature"];
        nodetype = "attribute";
    }else if(xmi.attributes()["base_Operation"]){
        id = xmi.attributes()["base_Operation"];
        nodetype = "class";
    }else if(xmi.attributes()["base_Class"]){
        id = xmi.attributes()["base_Class"];
        nodetype = "class";
    }else if(xmi.attributes()["base_DataType"]){
        id = xmi.attributes()["base_DataType"];
        nodetype = "class";
    }else if(xmi.attributes()["base_Element"]){
        id = xmi.attributes()["base_Element"];
        nodetype = "attribute";   //attribute or class
    }
    else{
        return;
    }
    if(nodetype == "class"){
        for(var i = 0; i < openModelclass.length; i++){
            if(openModelclass[i].id == id && openModelclass[i].fileName == currentFileName){
                openModelclass[i].status !== undefined ? openModelclass[i].status = str : null;
                break;
            }
        }
        if(i == openModelclass.length){
            var att = new OpenModelObject(id);
            att.status = str;
            att.fileName = currentFileName;
            openModelclass.push(att);
        }

    }else if(nodetype == "attribute"){
        for(var i = 0; i < openModelAtt.length; i++){
            if(openModelAtt[i].id == id && openModelAtt[i].fileName == currentFileName){
                openModelAtt[i].status !== undefined ? openModelAtt[i].status = str : null;
                break;
            }
        }
        if(i == openModelAtt.length){
            var att = new OpenModelObject();
            att.status = str;
            att.fileName = currentFileName;
            openModelAtt.push(att);
        }
    }
}

function createElement(xmi){
    //for(var key in xmi){
        //if(typeof xmi[key]=="object"){
        if(typeof xmi == "object"){
            var ele = xmi;
            var len;                    //ele is the length of xmi[key]
            var obj;
            //xmi[key].array?len=xmi[key].array.length:len=1;
            xmi.array ? len = xmi.array.length : len = 1;
            for (var i = 0; i < len; i++) {
                len == 1 ? obj = ele : obj = ele.array[i];
                /*if (obj.attributes()["xmi:type"] == "uml:Package"||obj.attributes()["xmi:type"]=="uml:Interface") {
                    var name;
                    obj.attributes().name?name=obj.attributes().name:console.error("ERROR:The attribute 'name' of tag 'xmi:id="+obj.attributes()["xmi:id"]+"' in this file is empty!");
                    name=name.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9\d]+$/g,"");
                    name=name.replace(/[^\w\.-]+/g,'_');
                    modName.push(name);
                    /!*  for(var j=0;j<yangModule.length;j++){
                         if(yangModule[j].name==name){
                         yangModule[j].import.push(modName.join("-"));
                         break;
                         }
                         }*!/
                    var namespace="\"urn:ONF:"+modName.join("-")+"\"";

                    var comment = "";
                    if (xmi["ownedComment"]) {
                        if(xmi['ownedComment'].array){
                            //comment="";
                            comment += xmi['ownedComment'].array[0].body.text();
                            for(var i = 1; i < xmi['ownedComment'].array.length; i++){
                                if(xmi['ownedComment'].array[i].body.hasOwnProperty("text")){
                                    comment += "\r\n"+xmi['ownedComment'].array[i].body.text();
                                }
                            }
                        }else if(xmi['ownedComment'].body){
                            comment = xmi['ownedComment'].body.text();
                        }
                    }

                    var m = new Module(modName.join("-"), namespace, "", modName.join("-"), "", "", "", comment, currentFileName);//create a new module by recursion
                    yangModule.push(m);
                    createElement(obj);
                   // return;
                }
                else {*/
                    var a = obj.attributes()["xmi:type"];
                    switch(a){
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
                        case "uml:Package":
                            createClass(obj, "grouping");
                            break;
                        case "uml:Operation":
                            createClass(obj, "rpc");
                            break;
                        case "uml:Realization":
                            createRealization(obj);
                            break;
                        case "uml:Association":
                            createAssociation(obj, currentFileName);
                            break;
                        case "uml:Signal":
                            createClass(obj, "notification");
                            break;
                        default:
                            break;
                    }
                //}
            }
        }
    //}
    //modName.pop(1);
}

function createClass(obj, nodeType) {
    try {
        var name;
        obj.attributes().name ? name = obj.attributes().name : console.error("ERROR:The attribute 'name' of tag 'xmi:id=" + obj.attributes()["xmi:id"] + "' in this file is empty!");
     //   name=name.replace(/:+\s*|\s+/g, '_');
        name = name.replace(/^[^A-Za-z0-9|_]+|[^A-Za-z0-9|_\d]+$/g, "");
        name = name.replace(/[^\w\.-]+/g, '_');
        var id = obj.attributes()["xmi:id"];
        var type = obj.attributes()["xmi:type"].split(":")[1];
        var config;
        obj.attributes().isReadOnly ? config = false : config = true;
        var isOrdered;
        obj.attributes().isOrdered ? isOrdered = obj.attributes().isOrdered : isOrdered = false;
        var path;
        /*if(modName.length>3&&nodeType!=="rpc"){
            path=modName[0]+"-"+modName[1]+"-"+modName[2]
        }else{
            path = modName.join("-");
        }*/
        path = modName.join("-");
        if (obj["ownedComment"]) {
            var comment = parseComment(obj);

            /*var len;
            var comment = "";
            obj["ownedComment"].array ? len = obj["ownedComment"].array.length : len = 1;
            if(obj['ownedComment'].array){
                comment = "";
                comment += obj['ownedComment'].array[0].body.text();
                for(var i = 1; i < obj['ownedComment'].array.length; i++){
                    if(obj['ownedComment'].array[i].body.hasOwnProperty("text")){
                        comment += "\r\n" + obj['ownedComment'].array[i].body.text();
                    }
                }
            }else if(obj['ownedComment'].body){
                comment = obj['ownedComment'].body.text();
            }*/
        }
        var node = new CLASS(name, id, type, comment, nodeType, path, config, isOrdered, currentFileName);
        if (obj.attributes().isAbstract == "true") {
            node.isAbstract = true;
        }
        if (obj.attributes().isLeaf == "true") {
            node.isLeaf = true;
        }
        if (obj.attributes().isActive == "true") {
            node.isActive = true;
        }
        if (obj.attributes().visibility) {
            node.visibility = obj.attributes().visibility;
        }
        if (obj['generalization']) {
            var len;
            obj['generalization'].array ? len = obj['generalization'].array.length : len = 1;
            for (var i = 0; i < len; i++) {
                var gen;
                len == 1 ? gen = obj['generalization'] : gen = obj['generalization'].array[i];
                node.buildGeneral(gen);
                //add type of 'uses' to 'grouping'.
                for (var j = 0; j < Grouping.length; j++) {
                    if (Grouping[j].id == node.generalization[i] && Grouping[j].fileName == node.fileName) {
                        break;
                    }
                }
                if (j == Grouping.length) {
                    var grouping = {};
                    grouping.id = node.generalization[i];
                    grouping.fileName = currentFileName;
                    Grouping.push(grouping);
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
                //下面这块还有一些问题~
                var r = node.buildAttribute(att);
                if (r !== "basicType") {
                    //add r to "Grouping" array
                    for (var j = 0; j < Grouping.length; j++) {
                        if (Grouping[j].id == r && node.fileName == Grouping[j].fileName) {
                            break;
                        }
                    }
                    if (j == Grouping.length) {
                        var grouping = {};
                        grouping.id = r;
                        grouping.fileName = node.fileName;
                        Grouping.push(grouping);
                    }
                    //if the nodeType of element referencing r is "list",new an object "association"
                    /*if(node.attribute[i].nodeType == "list"){
                        for(var j = 0; j < association.length; j++){
                            if(r == association.name){
                                break;
                            }
                        }
                        if(j == association.length){
                            var a = new Association(r, node.attribute[i].id, undefined, "list", undefined, node.attribute[i].upperValue, node.attribute[i].lowerValue, currentFileName);
                            association.push(a);
                        }
                    }*/
                    //add "path"
                    for(var k = 0; k < openModelAtt.length; k++){
                        if(openModelAtt[k].id == node.attribute[i].id && openModelAtt[k].fileName == node.attribute[i].fileName){
                            if(openModelAtt[k].passedByReference){
                                node.attribute[i].isleafRef = true;
                                break;
                            }
                            else if(openModelAtt[k].passedByReference == false){
                                node.attribute[i].isleafRef = false;
                                break;
                            }
                            if(openModelAtt[k].key){
                                att.attributes().name ? node.key[openModelAtt[k].key-1] = att.attributes().name : null;
                                node.attribute[i].partOfObjectKey = openModelAtt[k].key;
                            }
                        }
                    }
                    if(!node.attribute[i].isleafRef && node.type == "Class"){
                        var instance = {};
                        instance.id = r;
                        instance.pnode = node.id;
                        instance.path = node.path + ":" + node.name + "/" + node.attribute[i].name;
                        instance.fileName = node.fileName;
                        if(r == node.id){
                            instance.tpath = instance.path;
                            console.warn("Warning:xmi:id=" + r + " can not be compositeed by itself!");
                        }
                        isInstantiated.push(instance);
                    }
                }
                for(var k = 0; k < openModelAtt.length; k++){
                    if(openModelAtt[k].id == node.attribute[i].id && openModelAtt[k].fileName == node.attribute[i].fileName){
                        if(openModelAtt[k].key){
                            att.attributes().name ? node.key[openModelAtt[k].key-1] = att.attributes().name : null;
                            node.attribute[i].partOfObjectKey = openModelAtt[k].key;
                        }
                    }
                }
                for(var k = 0; k < use.length; k++){
                    if(use[k].id == node.attribute[i].id && use[k].fileName == node.attribute[i].fileName){
                        node.attribute[i].use = true;
                        use[k].name = node.attribute[i].name;
                    }
                }

                //search the "keyId",if r is the value of "keyId",add this node to keyList
                /*for (var j = 0; j < keyId.length; j++) {
                    if (r == keylist[j].id) {
                        node.key = keylist[j].name;
                        var a = new key(node.id, keylist[j].name);
                        node.attribute[i].key = keylist[j].name;
                        //keylist.push(a);
                        break;
                    }
                }
            */
            }
        }
        if (node.isEnum()) {
            node.buildEnum(obj);
            Typedef.push(node);
        }
        if (nodeType == "dataType") {
            node.isGrouping = true;
            if(node.attribute.length == 0 && node.generalization.length == 0){
                nodeType = "typedef";
                node.nodeType = "typedef";
            }else{
                node.nodeType = "grouping";
            }
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
            obj['ownedParameter'].array ? len = obj['ownedParameter'].array.length : len = 1;
            for (var i = 0; i < len; i++) {
                var para;
                len == 1 ? para = obj['ownedParameter'] : para = obj['ownedParameter'].array[i];
                r = node.buildOperate(para);

                if (r !== "basicType") {
                    for (var k = 0; k < Grouping.length; k++) {
                        if (Grouping[k].id == r && node.fileName == Grouping[k].fileName) {
                            break;
                        }
                    }
                    if (k == Grouping.length) {
                        var grouping = {};
                        grouping.id = r;
                        grouping.fileName = node.fileName;
                        Grouping.push(grouping);
                    }
                    /*if(node.attribute[i].nodeType == "list"){
                        for(var j = 0; j < association.length; j++){
                            if(r == association[j].name && node.fileName == association[j].fileName){
                                break;
                            }
                        }
                        if(j == association.length){
                            var a = new Association(r, node.attribute[i].id, "list", node.attribute[i].upperValue, node.attribute[i].lowerValue, currentFileName);
                            association.push(a);
                        }
                    }*/
                    for(var k = 0; k < openModelAtt.length; k++){
                        if(openModelAtt[k].id == node.attribute[i].id && openModelAtt[k].fileName == node.attribute[i].fileName){
                            if(openModelAtt[k].passedByReference){
                                node.attribute[i].isleafRef = true;
                                break;
                            }
                            else if(openModelAtt[k].passedByReference == false){
                                node.attribute[i].isleafRef = false;
                                break;
                            }
                            if(openModelAtt[k].key){
                                att.attributes().name ? node.key[openModelAtt[k].key - 1] = att.attributes().name : null;
                                node.attribute[i].partOfObjectKey = openModelAtt[k].key;
                            }
                        }
                    }

                }
                for(var k = 0; k < openModelAtt.length; k++){
                    if(openModelAtt[k].id == node.attribute[i].id && openModelAtt[k].fileName == node.attribute[i].fileName){
                        if(openModelAtt[k].key){
                            att.attributes().name ? node.key[openModelAtt[k].key-1] = att.attributes().name : null;
                            node.attribute[i].partOfObjectKey = openModelAtt[k].key;
                        }
                    }
                }
            }
        }
        for(var i = 0; i < merges.length; i++){
            if(node.id == merges[i].id && node.fileName == merges[i].fileName){
                node.mergeInto = merges[i].mergeInto;
                merges[i].name = node.name;
                for(var j = 0; j < node.attribute.length; j++){
                    if(node.attribute[j].use){
                        merges[i].childrenId.push(node.attribute[j].id);
                    }
                }
            }
        }
        //if(node.key == undefined){
        //    node.key = "localId";
        //}
        /*if(node.nodeType == "grouping"){
            //node.name = "G_"+node.name;
            node.Gname = node.name;//removed the "G_" prefix
        }*/
        Class.push(node);
        return;
    }
    catch(e){
        console.log(e.stack);
        throw e.message;
    }
}

function createAssociation(obj, fileName) {
    var id = obj.attributes()["xmi:id"];
    var memberEnd = [];
    var memberEnd1,             //appear in [memberEnd]
        memberEnd2;
    var associationName = obj.attributes().name;
    var ownedEndName;
    var associationType;
    //var type;       //uml:Property--attribute  others?
    var upperValue;
    var lowerValue;
    //obj.ownedEnd.attributes()["name"] ? ownedEndName = obj.ownedEnd.attributes()["name"] : ownedEndName = null;
    ownedEndName = "";
    if(obj.ownedEnd){
        if(obj.ownedEnd.array){
            associationType = 2;
        }else{
            associationType = 1;
        }
    }else{
        associationType = 0;
    }
    memberEnd = obj.attributes().memberEnd.split(" ");
    if(associationType == 0){
        memberEnd1 = memberEnd[0];
        memberEnd2 = memberEnd[1];
    }else if(associationType == 1){
        if(memberEnd[0] == obj.ownedEnd.attributes()["xmi:id"]){
            memberEnd1 = memberEnd[1];
            //memberEnd2 = obj.ownedEnd.attributes().type;
        }else if(memberEnd[1] == obj.ownedEnd.attributes()["xmi:id"]){
            memberEnd1 = memberEnd[0];
            //memberEnd2 = obj.ownedEnd.attributes().type;
        }else{
            console.warn("Warning!!!");
        }
        //var test = 0;
        for(var i = 0; i < Class.length; i++){
            for(var j = 0; j < Class[i].attribute.length; j++){
                //console.log("test " + (test++));
                if(memberEnd1 == Class[i].attribute[j].id && fileName == Class[i].fileName){
                    memberEnd2 = Class[i].attribute[j].type;
                }
            }
        }
        /*for(var i = 0; i < Class.length; i++){
            for(var j = 0; j < Class[i].attribute.length; j++){
                if(Class[i].attribute[j].association == id){
                    memberEnd2 = Class[i].attribute[j].id;
                    break;
                }
            }
            if(memberEnd2 != undefined){
                break;
            }
        }*/
        obj.ownedEnd.upperValue != undefined ? upperValue = obj.ownedEnd.upperValue.attributes().value : upperValue = "*";
        obj.ownedEnd.lowerValue != undefined ? lowerValue = obj.ownedEnd.lowerValue.attributes().value : lowerValue = 0;
    }else if(associationType == 2){
        if(obj.ownedEnd.array.length == 2){
            memberEnd1 = obj.ownedEnd.array[0].attributes().type;
            memberEnd2 = obj.ownedEnd.array[1].attributes().type;
        }else{
            console.warn("Warning: the association of xmi:id=" + id + " need two ownedEnds.")
        }
    }
    type = "";
    //type = obj.ownedEnd.attributes()["type"];
    /*if(obj.ownedEnd.upperValue == undefined){
        
    }else{
        upperValue = obj.ownedEnd.upperValue.attributes().value;

    }*/

    for(var i = 0; i < association.length; i++){
        if(id == association[i].id && currentFileName == association.fileName){
            break;
        }
    }
    if(i == association.length){
        var m = new Association(id, associationName, memberEnd1, memberEnd2, associationType, type, ownedEndName, upperValue, lowerValue, currentFileName);
        association.push(m);
    }

    /*var ele;
    var len;
    if (obj.ownedEnd) {
        obj.ownedEnd.array ? len = obj.ownedEnd.array.length : len = 1;
        for (var i = 0; i < len; i++) {
            obj.ownedEnd.array ? ele = obj.ownedEnd.array[i] : ele = obj.ownedEnd;
            var name = ele.attributes().type;
            var id = ele.attributes()['xmi:id'];
            var type;                   //type xmi:type conflict
            var upperValue;
            ele.upperValue ? upperValue = ele.upperValue.attributes().value : upperValue = 1;
            var lowerValue;
            ele.lowerValue ? lowerValue = ele.lowerValue.attributes().value : lowerValue = 1;
            if (parseInt(upperValue) !== 1) {
                for(var j = 0; j < association.length; j++){
                    if(name == association[j].name){
                        break;
                    }
                }
                if(j == association.length){
                    type = "list";
                    var a = new assoc(name, id, type, upperValue, lowerValue);
                    association.push(a);
                }
            }
        }
    }*/
}

function createRealization(obj) {
    var id = obj.attributes()["xmi:id"];
    var client,
        supplier,
        supplierFile,
        comment,
        temp;
    if(obj.attributes().client){
        client = obj.attributes().client;
    }else{
        console.log("Warning: The client of " + id + " does not exist!");
    }
    if(obj.attributes().supplier){
        supplier = obj.attributes().supplier;
        supplierFile = currentFileName;
    }else if(obj.supplier){
        supplierFile = obj.supplier.attributes().href.split('#')[0];
        supplier = obj.supplier.attributes().href.split('#').pop();
    }else{
        console.log("Warning: The supplier of " + id + " does not exist!");
    }
    if (obj["ownedComment"]) {
        comment = parseComment(obj);
        /*comment = "";
        if(obj['ownedComment'].array){
            comment += obj['ownedComment'].array[0].body.text();
            for(var i = 1; i < obj['ownedComment'].array.length; i++){
                if(obj['ownedComment'].array[i].body.hasOwnProperty("text")){
                    comment += "\r\n"+obj['ownedComment'].array[i].body.text();
                }
            }
        }else if(obj['ownedComment'].body){
            comment = obj['ownedComment'].body.text();
        }*/
    }
    temp = new Realization(id, client, supplier,currentFileName, supplierFile, comment, currentFileName);
    realization.push(temp);



}

function parseComment(xmi){
    var comment = "";
    if(xmi['ownedComment'].array){
        for(var j = 0; j < xmi['ownedComment'].array.length; j++){
            if(xmi['ownedComment'].array[j].hasOwnProperty("body") && xmi['ownedComment'].array[j].body.hasOwnProperty("text")){
                comment += xmi['ownedComment'].array[j].body.text() + "\r\n";
            }
        }
        comment = comment.replace(/\r\n$/g, "");
    }else if(xmi['ownedComment'].hasOwnProperty("body") && xmi['ownedComment'].body.hasOwnProperty("text")){
        comment = xmi['ownedComment'].body.text();
    }else{
        console.log("The comment of xmi:id=\"" + xmi.attributes()["xmi:id"] + "\" is undefined!");
    }
    return comment;
}

function obj2yang(ele){
    for(var t = 0; t < yangModule.length; t++){
        for(var j = 0; j < packages.length; j++){
            if(packages[j].path == "" && yangModule[t].fileName == packages[j].fileName){
                yangModule[t].children.push(packages[j]);
            }
        }
    }
    var tempPath;
    for(var j = 0; j < packages.length; j++){
        for(var k = 0; k < packages.length; k++){
            if(packages[j].path == "" && packages[j].fileName == packages[k].fileName){
                tempPath = packages[j].name;
            }else{
                tempPath = packages[j].path + "-" + packages[j].name;
            }
            if(tempPath == packages[k].path){
                packages[j].children.push(packages[k]);
            }
        }
    }
    var feat = [];
    for(var i = 0; i < ele.length; i++){
        var obj;
        for(var j = 0; j < openModelclass.length; j++) {
            if(openModelclass[j].id == ele[i].id && openModelclass[j].fileName == ele[i].fileName){
                if(openModelclass[j].condition){
                    for(var k = 0; k < feat.length; k++){
                        if(feat[k].name == openModelclass[j].condition && feat[k].fileName == openModelclass[j].fileName){
                            break;
                        }
                    }
                    if(k == feat.length){
                        feat.push(createFeature(openModelclass[j], ele[i].path));
                    }
                }
                break;
            }
        }
        if(ele[i].nodeType == "rpc"){
            obj = new RPC(ele[i].name, ele[i].description, ele[i].support, ele[i].status, ele[i].fileName);
        }
        else if(ele[i].nodeType == "notification"){
            var obj = new Node(ele[i].name, ele[i].description, "notification", undefined, undefined, ele[i].id, undefined, undefined, ele[i].support, ele[i].status, ele[i].fileName);
        }else{
            var obj = new Node(ele[i].name, ele[i].description, "grouping", ele[i]["max-elements"], ele[i]["max-elements"], ele[i].id, ele[i].config, ele[i].isOrdered, ele[i].support, ele[i].status, ele[i].fileName);
            obj.isAbstract = ele[i].isAbstract;
            obj.key = ele[i].key;
            // decide whether the "nodeType" of "ele" is grouping
            if(!ele[i].isAbstract) {
                for (var j = 0; j < Grouping.length; j++) {
                    if (ele[i].id == Grouping[j].id && ele[i].fileName == Grouping[j].fileName) {
                        break;
                    }
                }
                //if (j == Grouping.length && ele[i].type !== "DataType") {

                if (j == Grouping.length && ele[i].type !== "DataType") {
                    //if the ele is grouping ,"obj.nodeType" is  "container"
                    obj.nodeType = "container";
                }
            }
        }
        //create the object of "typedef"
        if(ele[i].nodeType == "enumeration") {
            obj.nodeType = "typedef";
            if(ele[i].generalization.length > 0){
                for(var j = 0; j < ele[i].generalization.length; j++) {
                    for (var k = 0; k < Typedef.length; k++) {
                        if(ele[i].generalization[j] == Typedef[k].id && ele[i].fileName == Typedef[k].fileName){
                            //console.log("");
                            if(ele[i].attribute.length == 0){
                                break;
                            }
                            ele[i].attribute[0].children = Typedef[k].attribute[0].children.concat(ele[i].attribute[0].children);
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
        if(ele[i].generalization.length !== 0) {
            for(var j = 0; j < ele[i].generalization.length; j++){
                for(var k = 0; k < Class.length; k++){
                    if(Class[k].id == ele[i].generalization[j] && Class[k].fileName == ele[i].fileName){
                        var Gname;
                        Class[k].Gname !== undefined ? Gname = Class[k].Gname : Gname = Class[k].name;
                        if(ele[i].fileName == Class[k].fileName){
                            if(Class[k].support){
                                obj.uses = new Uses(Class[k].name, Class[k].support)
                            }else{
                                //obj.uses.push(Class[k]);
                                obj.uses.push(Class[k].name);
                            }
                        }
                        else{
                            if(Class[k].support){
                                obj.uses = new Uses(Class[k].fileName.split('.')[0] + ":" + Class[k].name, Class[k].support)
                            }else{
                                obj.uses.push(Class[k].fileName.split('.')[0] + ":" + Class[k].name);
                            }
                            //importMod(ele[i],Class[k]);
                        }
                        break;
                    }
                }
            }
        }
        //deal with the ele whose "nodeType" is "grouping"
        if(ele[i].nodeType == "grouping" || ele[i].nodeType == "notification"){
            //create the "children" of object node(obj);
            ele[i].Gname !== undefined ? obj.name = ele[i].Gname : null;
            for (var j = 0; j < ele[i].attribute.length; j++) {
                //decide whether the subnode is "Derived Types"
                for(var k = 0; k < Typedef.length; k++){
                    if(Typedef[k].id == ele[i].attribute[j].type && Typedef[k].fileName == ele[i].fileName){
                        if(ele[i].attribute[j].nodeType == "container"){
                            ele[i].attribute[j].nodeType = "leaf";
                        }else if(ele[i].attribute[j].nodeType == "list"){
                            ele[i].attribute[j].nodeType = "leaf-list";
                        }
                        ele[i].attribute[j].isUses = false;
                        if(Typedef[k].fileName == ele[i].fileName){
                            ele[i].attribute[j].type = Typedef[k].name;
                        }else{
                            ele[i].attribute[j].type = Typedef[k].fileName.split('.')[0] + ":" + Typedef[k].name;
                            //importMod(ele[i], Typedef[k]);//add element "import" to module
                        }
                    }
                }
                var vr = "",
                    units = "",
                    inv = "",
                    avcNot = "",
                    dNot = "", 
                    cNot = "";
                for(var k = 0; k < openModelAtt.length; k++){
                    if(openModelAtt[k].id == ele[i].attribute[j].id && openModelAtt[k].fileName && ele[i].fileName){
                        units = openModelAtt[k].units;
                        vr = openModelAtt[k].valueRange;
                        if(openModelAtt[k].condition != undefined){
                            for(var m = 0; m < feat.length; m++){
                                if(feat[m].name == openModelAtt[k].condition && feat[m].fileName == openModelAtt[k].fileName){
                                    break;
                                }
                            }
                            if(m == feat.length){
                                feat.push(createFeature(openModelAtt[k], ele[i].path));
                                ele[i].attribute[j].support = feat[feat.length - 1].name;
                            }else{
                                ele[i].attribute[j].support = feat[m].name;
                            }
                        }
                        if(openModelAtt[k].status){
                            ele[i].attribute[j].status = openModelAtt[k].status;
                        }
                        if(openModelAtt[k].passedByReference){
                            ele[i].attribute[j].isleafRef = true;
                        }
                        if(openModelAtt[k].units){
                            ele[i].attribute[j].units = openModelAtt[k].units;
                        }
                        if(openModelAtt[k].valueRange){
                            ele[i].attribute[j].valueRange = openModelAtt[k].valueRange;
                        }
                        break;
                    }
                }
                //deal with the subnode whose type is neither "Derived Types" nor "Build-in Type".
                if(ele[i].attribute[j].isUses){
                    var name = ele[i].attribute[j].type;
                    //find the "class" whose value of "id" is value of "type"
                    for(var k = 0; k < Class.length; k++){
                        if(Class[k].id == name && Class[k].fileName == ele[i].fileName){
                            ele[i].attribute[j].isAbstract = Class[k].isAbstract;
                            if(Class[k].type !== "Class"){
                                ele[i].attribute[j].isleafRef = false;
                                ele[i].attribute[j].isGrouping = true;
                            }
                            //recursion
                            ele[i].attribute[j].key = Class[k].key;
                            if(i == k){
                                if(Class[k].instancePath[0] == "/"){
                                    ele[i].attribute[j].type = "leafref+path '" + Class[k].instancePath + "'";
                                }
                                else{
                                    ele[i].attribute[j].type = "leafref+path '/" + Class[k].instancePath + "'";
                                }
                                if(Class[k].isAbstract){
                                    ele[i].attribute[j].type = "string";
                                }
                                if(ele[i].attribute[j].nodeType == "list"){
                                    ele[i].attribute[j].nodeType = "leaf-list";
                                }
                                else if(ele[i].attribute[j].nodeType == "container"){
                                    ele[i].attribute[j].nodeType = "leaf";
                                }
                                break;
                            }
                            else {
                                if(ele[i].attribute[j].isleafRef){
                                    var p = Class[k].instancePath.split(":")[0];
                                    if(ele[i].path == p){
                                        ele[i].attribute[j].type = "leafref+path '/" + Class[k].instancePath.split(":")[1] + "'";
                                    }else{
                                        ele[i].attribute[j].type = "leafref+path '/" + Class[k].instancePath + "'";
                                    }
                                    //add element "import" to module
                                    /*for (var t = 0; t < yangModule.length; t++) {
                                        if (ele[i].fileName == yangModule[t].fileName) {
                                            for (var f = 0; f < yangModule[t].import.length; f++) {
                                                if (yangModule[t].import[f] == Class[k].fileName.split('.')[0]) {
                                                    break;
                                                }
                                            }
                                            if (f == yangModule[t].import.length) {
                                                yangModule[t].import.push(Class[k].fileName.split('.')[0]);
                                                break;
                                            }
                                        }
                                    }*/
                                    //}
                                    /*if(Class[k].isAbstract){
                                     ele[i].attribute[j].type = "string";
                                     }*/
                                    if(ele[i].attribute[j].nodeType == "list"){
                                        ele[i].attribute[j].nodeType = "leaf-list";
                                    }
                                    else if(ele[i].attribute[j].nodeType == "container"){
                                        ele[i].attribute[j].nodeType = "leaf";
                                    }
                                    break;
                                }
                                else{
                                    var Gname;
                                    Class[k].Gname !== undefined ? Gname = Class[k].Gname : Gname = Class[k].name;
                                    if (ele[i].fileName == Class[k].fileName) {
                                        if(Class[k].support){
                                            ele[i].attribute[j].isUses = new Uses(Gname, Class[k].support)
                                        }else{
                                            //ele[i].attribute[j].isUses =Gname;
                                            ele[i].attribute[j].isUses = Class[k].name;
                                        }
                                        break;
                                    } else {
                                        //importMod(ele[i],Class[k]);//add element "import" to module
                                        if(Class[k].support){
                                            ele[i].attribute[j].isUses = new Uses(Class[k].fileName.split('.')[0] + ":" + Gname, Class[k].support)
                                        }else{
                                            //ele[i].attribute[j].isUses = Class[k].fileName.split('.')[0] + ":" + Gname;
                                            ele[i].attribute[j].isUses = Class[k].fileName.split('.')[0] + ":" + Gname;
                                        }
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    //didn't find the "class"
                    if(k == Class.length){
                        ele[i].attribute[j].nodeType == "list" ? ele[i].attribute[j].nodeType = "leaf-list" : ele[i].attribute[j].nodeType = "leaf";
                        ele[i].attribute[j].type = "string";
                    }
                }
                if(ele[i].attribute[j].type.split("+")[0] == "leafref"){
                    ele[i].attribute[j].type = new Type("leafref", ele[i].attribute[j].id, ele[i].attribute[j].type.split("+")[1], vr, "", "", units, ele[i].fileName);
                }else if(ele[i].attribute[j].nodeType == "leaf" || ele[i].attribute[j].nodeType == "leaf-list"){
                    ele[i].attribute[j].type = new Type(ele[i].attribute[j].type, ele[i].attribute[j].id, undefined, vr, "", "", units, ele[i].fileName);
                }/*else{
                 ele[i].attribute[j].type = new Type(ele[i].attribute[j].type, ele[i].attribute[j].id, undefined, vr, "", "", units, ele[i].fileName);
                 }*/
                obj.buildChild(ele[i].attribute[j], ele[i].attribute[j].nodeType);//create the subnode to obj
            }
        }
        //create the object of "typedef"
        if(ele[i].nodeType == "typedef"){
            obj.nodeType = "typedef";
            if(ele[i].attribute[0]){
                obj.buildChild(ele[i].attribute[0], "typedef");

            }else{
                obj.buildChild(ele[i], "typedef");
            }
        }
        //create "rpc"
        if(ele[i].nodeType == "rpc"){
            for (var j = 0; j < ele[i].attribute.length; j++) {
                var pValue = ele[i].attribute[j];
                for(var k = 0; k < Typedef.length; k++){
                    if(Typedef[k].id == pValue.type && Typedef[k].fileName == ele[i].fileName){
                        if(pValue.nodeType == "list"){
                            pValue.nodeType = "leaf-list";
                        }else{
                            pValue.nodeType = "leaf";
                        }
                        pValue.isUses = false;
                        if(Typedef[k].fileName == ele[i].fileName){
                            pValue.type = Typedef[k].name;
                        }else{
                            pValue.type = Typedef[k].fileName.split('.')[0] + ":" + Typedef[k].name;
                            //importMod(ele[i], Typedef[k]);
                        }
                        break;
                    }
                }
                for(var k = 0; k < openModelAtt.length; k++){
                    if(openModelAtt[k].id == ele[i].attribute[j].id && openModelAtt[k].fileName == ele[i].fileName){
                        //units = openModelAtt[k].units;
                        //vr = openModelAtt[k].valueRange;
                        pValue.units = openModelAtt[k].units;
                        pValue.valueRange = openModelAtt[k].valueRange;
                        if(openModelAtt[k].condition){
                            for(var m = 0; m < feat.length; m++){
                                if(feat[m].name == openModelAtt[k].condition && feat[m].fileName == openModelAtt[k].fileName){
                                    break;
                                }
                            }
                            if(m == feat.length){
                                feat.push(createFeature(openModelAtt[k], ele[i].path));
                                ele[i].attribute[j].support = feat[feat.length - 1].name;
                            }else{
                                ele[i].attribute[j].support = feat[m].name;
                            }
                        }
                        if(openModelAtt[k].status){
                            ele[i].attribute[j].status = openModelAtt[k].status;
                        }
                        if(openModelAtt[k].passedByReference){
                            ele[i].attribute[j].isleafRef = true;
                        }
                        break;
                    }
                }
                if(pValue.isUses){
                    var name = pValue.type;
                    for(var k = 0; k < Class.length; k++){
                        if(Class[k].id == name && Class[k].fileName == ele[i].fileName){
                            pValue.isAbstract = Class[k].isAbstract;
                            if(Class[k].type !== "Class"){
                                pValue.isGrouping = true;
                            }
                            //recursion
                            if(i == k){
                                pValue.type = "leafref+path '/" + Class[k].instancePath.split(":")[1] + "'";
                                if(Class[k].isGrouping){
                                    pValue.type = "string";
                                }
                                if(pValue.nodeType == "list"){
                                    pValue.nodeType = "leaf-list";
                                }
                                else if(pValue.nodeType == "container"){
                                    pValue.nodeType = "leaf";
                                }
                                break;
                            }
                            /*else {
                             if(pValue.isleafRef){
                             var p = Class[k].instancePath.split(":")[0];
                             if(ele[i].path == p){
                             pValue.type = "leafref+path '/" + Class[k].instancePath.split(":")[1] + "'";
                             }else{
                             pValue.type = "leafref+path '/" + Class[k].instancePath + "'";
                             importMod(ele[i], p);
                             }
                             //
                             if(Class[k].isAbstract){
                             pValue.type = "string";
                             }
                             //
                             if(pValue.nodeType == "list"){
                             pValue.nodeType = "leaf-list";
                             }
                             else if(pValue.nodeType == "container"){
                             pValue.nodeType = "leaf";
                             }
                             break;
                             }*/
                            else {
                                var Gname;
                                Class[k].Gname !== undefined ? Gname = Class[k].Gname : Gname = Class[k].name;
                                if (ele[i].fileName == Class[k].fileName) {
                                    if (Class[k].support) {
                                        pValue.isUses = new Uses(Gname, Class[k].support)
                                    } else {
                                        //pValue.isUses = Gname;
                                        pValue.isUses = Class[k].name;

                                    }
                                    break;
                                }
                                else {
                                    //
                                    //importMod(ele[i], Class[k]);//add element "import" to module
                                    var Gname;
                                    Class[k].Gname !== undefined ? Gname = Class[k].Gname : Gname = Class[k].name;
                                    if (Class[k].support) {
                                        pValue.isUses = new Uses(Class[k].fileName.split('.')[0] + ":" + Gname, Class[k].support)
                                    } else {
                                        //pValue.isUses = Class[k].fileName.split('.')[0] + ":" + Gname;
                                        pValue.isUses = Class[k].name;
                                    }
                                    pValue.key = Class[k].key;
                                    break;
                                }
                            }
                        }
                        //}
                    }
                    if(k == Class.length){
                        pValue.nodeType == "list" ? ele[i].attribute[j].nodeType = "leaf-list" : pValue.nodeType = "leaf";
                        pValue.type = "string";
                    }
                }
                obj.buildChild(pValue, pValue.nodeType, pValue.rpcType);
            }
        }
        //decide whether a "container" is "list"
        if(obj.nodeType == "container") {
            for (var k = 0; k < association.length; k++) {
                if (ele[i].id == association[k].name && ele[i].fileName == association[k].fileName) {
                    obj.nodeType = "list";
                    if(association[k].upperValue){
                        obj["max-elements"] = association[k].upperValue;
                    }
                    if(association[k].lowerValue){
                        obj["min-elements"] = association[k].lowerValue;
                    }
                    obj.nodeType = "list";
                    break;
                }
            }
            if(k == association.length){
                obj["ordered-by"] = undefined;
            }
            obj.nodeType = "list";//
        }
        //add the "obj" to module by attribute "path"
        var newobj;
        var flag = true;
        if(ele[i].nodeType == "notification"){
            //var a;
            newobj = new Node(ele[i].name, undefined, "notification", undefined, undefined, obj.id, obj.config, obj["ordered-by"], undefined, undefined, ele[i].fileName);
            //newobj.uses.push(obj.name);
            newobj.uses.push(obj.name);
            
        } else if(ele[i].name == "Context") {
        //else if(ele[i].isAbstract == false && ele[i].nodeType == "grouping"){
            flag=false;
            newobj = new Node(ele[i].name, undefined, "container", undefined, undefined, obj.id, obj.config, obj["ordered-by"], undefined, undefined, ele[i].fileName);
            newobj.key = obj.key;
            newobj.keyid = obj.keyid;
            //newobj.uses.push(obj.name);
            newobj.uses.push(obj.name);
            if(obj.nodeType != "grouping"){
                newobj.nodeType = obj.nodeType;
                obj.nodeType = "grouping";
            }
            //decide whether a "container" is "list"
            for (var k = 0; k < association.length; k++) {
                if (ele[i].id == association[k].name) {
                    newobj.nodeType = "list";
                    if(association[k].upperValue){
                        newobj["max-elements"] = association[k].upperValue;
                    }
                    if(association[k].lowerValue){
                        newobj["min-elements"] = association[k].lowerValue;
                    }
                    break;
                }
            }
            //newobj.nodeType = "list";//
            if(newobj.nodeType !== "list"){
                newobj["ordered-by"] = undefined;
            }
            console.info ("******* Top-Level Object: " + newobj.name + " Type:" + newobj.nodeType)
        }
        if(flag && !ele[i].isGrouping){
            obj.name = ele[i].name;
        }
        if(ele[i].path == ""){
            for(var t = 0; t < yangModule.length; t++){
                if(ele[i].fileName == yangModule[t].fileName){
                	if (ele[i].name == "Context" || ele[i].nodeType == "notification") {
                    //if ((ele[i].isAbstract == false && ele[i].nodeType == "grouping") || ele[i].nodeType == "notification") {
                        yangModule[t].children.push(newobj);
                    }
                    /*if (feat.length) {
                        yangModule[t].children = yangModule[t].children.concat(feat);
                    }*/
                    yangModule[t].children.push(obj);
                    break;
                }
            }
        }

        for(var t = 0; t < packages.length; t++) {
            if (packages[t].path == "") {
                tempPath = packages[t].name;
            } else {
                tempPath = packages[t].path + "-" + packages[t].name
            }
            if (tempPath == ele[i].path && packages[t].fileName == ele[i].fileName) {
                //create a new node if "ele" needs to be instantiate
            	if (ele[i].name == "Context" || ele[i].nodeType == "notification") {
                //if ((ele[i].isAbstract == false && ele[i].nodeType == "grouping") || ele[i].nodeType == "notification") {
                    packages[t].children.push(newobj)
                }
                /*if (feat.length) {

                    packages[t].children = packages[t].children.concat(feat);
                }*/
                packages[t].children.push(obj);
                break;
            }
        }
    }
    if(feat.length){
        for(var i = 0; i < feat.length; i++){
            if(feat[i].path == ""){
                for(var j = 0; j < yangModule.length; j++){
                    if(feat[i].fileName == yangModule[j].fileName){
                        yangModule[j].children.push(feat[i]);
                        break;
                    }
                }
            }else{
                for(var j = 0; j < packages.length; j++) {
                    if (packages[j].path == "") {
                        tempPath = packages[j].name;
                    }else {
                        tempPath = packages[j].path + "-" + packages[j].name;
                    }
                    if (tempPath == feat[i].path && packages[j].fileName == feat[i].fileName) {
                        packages[j].children.push(feat[i]);
                        break;
                    }
                }
            }
        }
    }
    console.log("xmi translate to yang successfully!")
}

//var m = 1;
function createFeature(obj, path){
    var feat = new Feature(obj.id, obj.condition, path, "",obj.fileName);
    return feat;
}

function datatypeExe(id, fileName){
    for(var i = 0; i < Class.length; i++){
        if(Class[i].id == id && Class[i].fileName == fileName){
            if(Class[i].attribute.length == 1 && Class[i].generalization.length == 0){
                if(Class[i].nodeType == "enumeration"){
                    return "enumeration," + i;
                }
                if(Class[i].attribute[0].isUses == false){
                    return "typedef," + Class[i].attribute[0].type;
                }else{
                    datatypeExe(Class[i].attribute[0].type, fileName);
                }
            }else{
                return "grouping";
            }
        }
    }
}

function importMod(ele,obj){
    for (var t = 0; t < yangModule.length; t++) {
        if (ele.path == yangModule[t].name && ele.fileName == yangModule[t].fileName) {
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

function parseOpenModelpandr(xmi){              //parse prune and refactor
    var id;
    if(xmi.attributes()["base_Realization"]){
        id = xmi.attributes()["base_Realization"];
    }

    for(var i = 0; i < openModelpandr.length; i++){
        if(id == openModelpandr[i].id && currentFileName == openModelpandr[i].fileName){
            break;
        }
    }
    if(i == openModelpandr.length){
        var pandr = new OpenModelPandr(id,currentFileName);
        openModelpandr.push(pandr);
    }
}

function parseMerge(xmi){
    var obj = {};
    /*if(xmi.attributes().mergeInto || xmi.attributes().mergeInto == ""){
        obj.id = xmi.attributes()["base_Element"];
        obj.mergeInto = xmi.attributes().mergeInto;
        obj.fileName = currentFileName;
        obj.childrenId = [];
        merges.push(obj);
    }*/
    obj.id = xmi.attributes()["base_Element"];
    obj.fileName = currentFileName;
    obj.childrenId = [];
    if(xmi.attributes().mergeInto && xmi.attributes().mergeInto !== ""){
        var temp=xmi.attributes().mergeInto;
        if(temp.indexOf(":")!=-1){
            var arr=temp.split(":");
            obj.mergeIntoFile=arr[0];
            obj.mergeInto=arr[1];
        }else{
            obj.mergeIntoFile="";
            obj.mergeInto=temp;
        }
        //obj.mergeInto = xmi.attributes().mergeInto;
    }else{
        obj.mergeInto="";
    }
    merges.push(obj);
}

function parseUse(xmi){
    var obj = {};
    obj.id = xmi.attributes()["base_Element"];
    obj.fileName = currentFileName;
    use.push(obj);
}

function parseAssociation() {
    for(var i = 0; i < association.length; i++){
        if(association[i].type == "class"){
            for(var j = 0; j < Class.length; j++){
                if(Class[j].id == association[i].memberEnd[0] && Class[j].fileName == association[i].fileName){
                    association[i].member[0] = Class[j];
                }else if(Class[j].id == association[i].memberEnd[1] && Class[j].fileName == association[i].fileName){
                    association[i].member[1] = Class[j];
                }
                if(association[i].member[0] && association[i].member[1]){
                    //console.log(i + " " + association[i].member[0].name + "   " + association[i].member[1].name)
                    break;
                }
            }
        }else{
            for(var j = 0; j < Class.length; j++){
                for(var k = 0; k < Class[j].attribute.length; k++){
                    /*if(Class[j].attribute[k].id == association[i].memberEnd[0] && Class[j].fileName == association[i].fileName){
                        association[i].member[0] = Class[j].attribute[k];
                    }else if(Class[j].attribute[k].id == association[i].memberEnd[1] && Class[j].fileName == association[i].fileName){
                        association[i].member[1] = Class[j].attribute[k];
                    }
                    if(association[i].member[0] && association[i].member[1]){
                        console.log(i + " " + association[i].member[0].name + "   " + association[i].member[1].name)
                        break;
                    }*/
                }
            }
        }
    }

}

function pruningAndRefactoring(){
    var client,
        supplier,
        clientFile,
        supplierFile,
        attClient,
        attSupplier,
        attClientClass,
        attSupplierClass,
        attClientFile,
        attSupplierFile;


    /*if(splitClassId==null||splitClassId.length==0){
        for(var i=0;i<copyAndSplit.splitClass.length;i++){
            copyAndSplit.splitClass[i] = copyAndSplit.splitClass[i].replace(/^[^A-Za-z0-9|_]+|[^A-Za-z0-9|_\d]+$/g, "");
            copyAndSplit.splitClass[i] = copyAndSplit.splitClass[i].replace(/[^\w\.-]+/g, '_');
            for(var j=0;j<Class.length;j++){
                //console.log(Class[j].id);
                if(Class[j].fileName==supplierFileName && Class[j].name==copyAndSplit.splitClass[i] ){
                    splitClassId.push(Class[j].id);
                }
            }
        }
    }
    console.log(splitClassId);*/

    for(var i = 0; i < Class.length; i++){
        //flag = 0;
        for(var j = i + 1; j < Class.length; j++){
            if(Class[i].id.substring(0, 23) == Class[j].id.substring(0, 23) && Class[i].fileName != Class[j].fileName){
                if(Class[i].fileName == clientFileName && Class[j].fileName == supplierFileName){
                    client = Class[i];
                    supplier = Class[j];
                }else if(Class[j].fileName == clientFileName && Class[i].fileName == supplierFileName){
                    client = Class[j];
                    supplier = Class[i];
                }else{
                    continue;
                    //console.warn("Warning : The file name of project isn't consistent with clientFileName or supplierFileName setted !");
                }
                if(client && supplier){
                    var temp = new ClassCompare(client, supplier);
                    classCompare.push(temp);
                    client.isInRealization = true;
                    supplier.isInRealization = true;
                    client = "";
                    supplier = "";
                    //break;
                }

            }
        }


        if(Class[i].fileName == supplierFileName){
            for(var j = 0; j < splitClassId.length; j++){
                if(Class[i].id == splitClassId[j].classId){
                    for(var k = 0; k < association.length; k++){
                        if(association[k].fileName == clientFileName && Class[i].id.substring(0, 23) == association[k].id.substring(0,23)){
                            var classwithassociation = new ClassWithAssociation(association[k], Class[i]);
                            classWithAssociation.push(classwithassociation);
                        }
                    }
                    break;
                }
            }
        }
    }
    //prunedClass && addedClass
    client=[];
    supplier=[];
    for (var i = 0; i < Class.length; i++) {
        if (Class[i].fileName == clientFileName) {
            client.push(Class[i]);
        }
        else if (Class[i].fileName == supplierFileName) {
            supplier.push(Class[i]);
        }
    }
    //prunedClass
        for(var i = 0; i < supplier.length; i++){
          var flag=0;
          for(var j = 0; j < client.length; j++){
             if(supplier[i].id==client[j].id){
                    flag=1;
        }}
        if(flag==0){
            prunedClass.push(supplier[i]);
        }}
//addedClass
    for(var i = 0; i < client.length; i++){
        var flag=0;
        for(var j = 0; j < supplier.length; j++){
            if(supplier[j].id==client[i].id){
                flag=1;
            }}
        if(flag==0){
            addedClass.push(client[i]);
        }}
    client=[];
    supplier=[];
//prunedAttribute && attributeCompare && addedAttribute
    for(var i = 0; i < classCompare.length; i++){
        client = classCompare[i].client;
        supplier = classCompare[i].supplier;
        for(var j = 0;j < client.attribute.length; j++){
            var flag=0;
            for(var k = 0;k < supplier.attribute.length; k++){
                if(client.attribute[j].id && supplier.attribute[k].id && client.attribute[j].id.substring(0, 23) == supplier.attribute[k].id.substring(0, 23)){
                    flag=1;
                    client.attribute[j].isInRealization = true;
                    supplier.attribute[k].isInRealization = true;
                    var temp = new AttributeCompare(client.attribute[j], supplier.attribute[k], client, supplier);
                    attributeCompare.push(temp);
                }
            }
        }
            //find prunedAttribute
            if(client.attribute.length==0){
            for(var p = 0;p < supplier.attribute.length; p++){
                var prunedatt;
                prunedatt = new buildPrunedAtt(supplier.id, supplier.name, supplier.attribute[p].id, supplier.attribute[p].name);
                prunedAttribute.push(prunedatt);
            }}else {
                for (var m = 0; m < supplier.attribute.length; m++) {
                    var flag = 0;
                    for (var n = 0; n < client.attribute.length; n++) {
                        if (client.attribute[n].id && supplier.attribute[m].id && client.attribute[n].id == supplier.attribute[m].id) {
                            flag = 1;
                        }
                    }
                        if (flag == 0) {
                            var prunedatt;
                            prunedatt = new buildPrunedAtt(supplier.id, supplier.name, supplier.attribute[m].id, supplier.attribute[m].name);
                            prunedAttribute.push(prunedatt);
                        }

                }
            }
        //find addedAttribute
        if(supplier.attribute.length==0){
            for(var p = 0;p < client.attribute.length; p++){
                var addedatt;
                addedatt = new buildPrunedAtt(client.id, client.name, client.attribute[p].id, client.attribute[p].name);
                addedAttribute.push(addedatt);
            }}else {
            for (var m = 0; m < client.attribute.length; m++) {
                var flag = 0;
                for (var n = 0; n < supplier.attribute.length; n++) {
                    if (supplier.attribute[n].id && client.attribute[m].id && client.attribute[m].id == supplier.attribute[n].id) {
                        flag = 1;
                    }
                }
                if (flag == 0) {
                    var addedatt;
                    addedatt = new buildPrunedAtt(client.id, client.name, client.attribute[m].id, client.attribute[m].name);
                    addedAttribute.push(addedatt);
                }

            }
        }
            /*if(prunedFlag==1){
                prunedClass=[];
                prunedAttribute=[];
                addedClass=[];
                addedAttribute=[];
            }*/
    }

    client = "";
    supplier = "";
    for(var i = 0; i < association.length; i++){
        for(var j = i + 1; j < association.length; j++){
            if(association[i].id.substring(0, 23) == association[j].id.substring(0, 23) && association[i].fileName != association[j].fileName){
                if(association[i].fileName == clientFileName && association[j].fileName == supplierFileName){
                    client = association[i];
                    supplier = association[j];
                }else if(association[j].fileName == clientFileName && association[i].fileName == supplierFileName){
                    client = association[j];
                    supplier = association[i];
                }else{
                    console.log("Warning: xmi:id=" + association[i].id + " don't match with clientFileName and supplierFileName!");
                }
            }
            if(client && supplier){
                client.isInRealization = true;
                supplier.isInRealization = true;
                var temp = new AssociationCompare(client, supplier);
                associationCompare.push(temp);
                client = "";
                supplier = "";
            }
        }
    }


    
    /*for(var i = 0; i < realization.length; i++) {
        client = "";
        supplier = "";
        //console.log("client: "+client);
        for(var j = 0; j < Class.length; j++){
            if(realization[i].clientid == Class[j].id && realization[i].clientFile.split('.')[0] == Class[j].fileName.split('.')[0]){
                //console.log(realization[i].clientFile);
                //console.log(Class[j].fileName);
                client = Class[j];
                Class[j].isInRealization = true;
            }
            if(realization[i].supplierid == Class[j].id && realization[i].supplierFile.split('.')[0] == Class[j].fileName.split('.')[0]){
                supplier = Class[j];
                Class[j].isInRealization = true;
            }
        }
        if(client&&supplier){
            var temp = new ClassCompare(client,supplier);
            classCompare.push(temp);
            continue;
        }
        for(var j = 0; j < Class.length; j++) {
            for (var k = 0; k < Class[j].attribute.length; k++) {
                if (realization[i].clientid == Class[j].attribute[k].id && realization[i].clientFile.split('.')[0] == Class[j].fileName.split('.')[0]) {
                    attClient = Class[j].attribute[k];
                    Class[j].attribute[k].isInRealization = true;
                    attClientClass = Class[j];
                }
                if (realization[i].supplierid == Class[j].attribute[k].id && realization[i].supplierFile.split('.')[0] == Class[j].fileName.split('.')[0]) {
                    attSupplier = Class[j].attribute[k];
                    Class[j].attribute[k].isInRealization = true;
                    attSupplierClass = Class[j];
                }
            }
        }
        if(attClient&&attSupplier){
            for(var m = 0; m < attributeCompare.length; m++){
                if((attClient == attributeCompare[m].client)&&(attSupplier == attributeCompare[m].supplier)){
                    break;
                }
            }
            if(m == attributeCompare.length){
                var temp = new AttributeCompare(attClient, attSupplier, attClientClass, attSupplierClass);
                attributeCompare.push(temp);
            }
            continue;
        }


    }*/
}

function writeLogFile(files){
    var log;
    var thedate = new Date();
    var path;
    var postfix;
    var prefix = [];
    var allowedFileExtensions = ['xml', 'uml'];
    var currentFileExtension;
    //for(var j = 0; j < files.length; j++){
    /*prefix = files.split('.');
    postfix = files.split('.').pop();
    path = "";
    for(var m = 0; m < prefix.length-1; m++){
        path += prefix[m];
    }*/

    log = "";
    log += "****************************************************************************************************" + "\r\n";
    log += "* Name: Pruning and Refactoring Tool" + "\r\n";
    log += "* Copyright 2015 CAICT (China Academy of Information and Communication Technology (former China Academy of Telecommunication Research)). All Rights Reserved." + "\r\n" + "*\r\n";
    log += "* Time : " + thedate.toLocaleString() + "\r\n";
    log += "* Input  File : ";
    for(var i = 0; i < files.length; i++){
        currentFileExtension = files[i].split('.').pop();
        if (allowedFileExtensions.indexOf(currentFileExtension) !== -1){
            log += files[i] + "\r\n\r\n";
        }
    }
    log = log.replace(/\r\n\r\n/g, "\r\n*               ");
    path = "PruningAndRefactoring.txt";
    log += "\r\n* Output File : " + path + "\r\n" + "*\r\n";
    log += "* The above copyright information should be included in all distribution, reproduction or derivative works of this software." + "\r\n" + "*\r\n";
    log += "****************************************************************************************************" + "\r\n";

    log += "\r\n" + "Class Comparison     : " + "\r\n\r\n";
    for(var i = 0; i < classCompare.length; i++){
        log += "supplier     : " + classCompare[i].supplier.name + "\t\t\t\tclient     : " + classCompare[i].client.name;
        if(classCompare[i].supplier.name == classCompare[i].client.name){
            log += "\t\t\tClass'name isn't changed." + "\r\n";
        }else{
            log += "\t\t\tClass'name is changed." + "\r\n";
        }
        log += "supplierFile : " + classCompare[i].supplier.fileName + "\t\t\t\tclientFile : " + classCompare[i].client.fileName;
        if(classCompare[i].supplier.fileName.split('.')[0] == classCompare[i].client.fileName.split('.')[0]){
            log += "\t\t\tFile name is the same." + "\r\n";
        }else{
            log += "\t\t\tFile name isn't the same." + "\r\n";
        }
    }
    log += "\r\n" + "Attribute Comparison : " + "\r\n\r\n";
    for(var i = 0; i < attributeCompare.length; i++){
        log += "supplier      : " + attributeCompare[i].supplier.name + "\t\t\tclient      : " + attributeCompare[i].client.name;
        if(attributeCompare[i].supplier.name == attributeCompare[i].client.name){
            log += "\t\t\tAttribute'name isn't changed." + "\r\n";
        }else{
            log += "\t\t\tAttribute'name is changed." + "\r\n";
        }
        log += "supplierClass : " + attributeCompare[i].supplierClass.name + "\t\t\tclientClass : " + attributeCompare[i].clientClass.name + "\r\n";

        log += "supplierFile : " + attributeCompare[i].supplierClass.fileName + "\t\t\t\tclientFile : " + attributeCompare[i].clientClass.fileName;
        if(attributeCompare[i].supplierClass.fileName.split('.')[0] == attributeCompare[i].clientClass.fileName.split('.')[0]){
            log += "\t\t\tFile name is the same." + "\r\n";
        }else{
            log += "\t\t\tFile name isn't the same." + "\r\n";
        }


        var array =["config", "nodeType", "defaultValue", "isUses", "status", "isAbstract", "rpcType", "key", "path", "support", "isleafRef", "isOrdered", "min-elements", "max-elements"];
        for(var j = 0; j < array.length; j++){
            if(attributeCompare[i].supplier[array[j]]||attributeCompare[i].client[array[j]]){
                log += "\t\t\t" + array[j] + " : " + attributeCompare[i].supplier[array[j]] + "\t\t\t\t" + array[j] + " : " + attributeCompare[i].client[array[j]];
                array[j] = array[j].replace(/s$/g, "");
                if(attributeCompare[i].supplier[array[j]] == attributeCompare[i].client[array[j]]){
                    log += "\t\t\tAttribute's " + array[j] + "s are the same." + "\r\n";
                }else{
                    log += "\t\t\tAttribute's " + array[j] + "s aren't the same." + "\r\n";
                }
            }
        }
        if(attributeCompare[i].supplier.type||attributeCompare[i].client.type){
            log += "\tTypes Comparison :\r\n"
            if(typeof attributeCompare[i].supplier.type == "string" && typeof attributeCompare[i].client.type == "string"){
                log += "\t\t\t" + "type" + " : " + attributeCompare[i].supplier.type+ "\t\t\t\t" + "type" + " : " + attributeCompare[i].client.type;
                if(attributeCompare[i].supplier.type == attributeCompare[i].client.type){
                    log += "\t\t\tAttribute's types are the same." + "\r\n";
                }else{
                    log += "\t\t\tAttribute's types are not the same." + "\r\n";
                }
            }
            if(typeof attributeCompare[i].supplier.type == "object" &&typeof attributeCompare[i].client.type == "object"){
                var typeMumber =["name", "range", "units", "path"];
                for(var j = 0; j < typeMumber.length; j++){
                    if(attributeCompare[i].supplier.type[typeMumber[j]] || attributeCompare[i].supplier.type[typeMumber[j]]){
                        log += "\t\t\t\t" + typeMumber[j] + " : " + attributeCompare[i].supplier.type[typeMumber[j]] + "\t\t\t\t" + typeMumber[j] + " : " + attributeCompare[i].client.type[typeMumber[j]];
                        typeMumber[j] = typeMumber[j].replace(/s$/g, "");
                        if(attributeCompare[i].supplier.type[typeMumber[j]] == attributeCompare[i].client.type[typeMumber[j]]){
                            log += "\t\t\t" + typeMumber[j] + "s of types are the same." + "\r\n";
                        }else{
                            log += "\t\t\t" + typeMumber[j] + "s of types aren't the same." + "\r\n";
                        }
                    }
                }
            }
        }
    }

    //path = "./project/" + path + "_Pruning_and_Refactoring.txt";
    try{
        fs.writeFile("./project/" + path,log,function (error) {
        //fs.writeFile("./project/"+path,log,function (error) {
            if(error){
                console.log(error.stack);
                throw(error.message);
            }
        });
    }catch (e){
        console.log(e.stack);
        throw (e.message);
    }

    console.log("Write " + path + " successful!");
    //}
}


function writeUml() {
    var log = "";
    var temp = 1;
    var path = "mapping.uml";
    var client;
    var supplier;
    var comparisonAtt = "";
    var comparison = "";
    var arrayAtt = ["name", "isReadOnly", "defaultValue", "isUses", "status", "isAbstract", "rpcType","valueRange", "units", "path", "support", "condition", "isleafRef", "isOrdered", "isStatic", "isUnique", "aggregation", "visibility", "min-elements", "max-elements", "partOfObjectKey"];
    var arrayClass = ["name", "support", "condition", "status", "visibility", "isAbstract", "isActive", "isLeaf"];
    var arrayAssociation = ["name", "memberEnd1", "memberEnd2", "associationType", "type", "ownedEndName", "upperValue", "lowerValue"];
    var postfix = "";
    log += "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\r\n";
    log += "<xmi:XMI xmi:version=\"20131001\" xmlns:xmi=\"http://www.omg.org/spec/XMI/20131001\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:OpenModel_Profile=\"http:///schemas/OpenModel_Profile/_0tU-YNyQEeW6C_FaABjU5w/14\" xmlns:ecore=\"http://www.eclipse.org/emf/2002/Ecore\" xmlns:uml=\"http://www.eclipse.org/uml2/5.0.0/UML\"";
    log += " xsi:schemaLocation=\"http:///schemas/OpenModel_Profile/_0tU-YNyQEeW6C_FaABjU5w/14 ../../OpenModelProfile/OpenModel_Profile.profile.uml#_0tZP0NyQEeW6C_FaABjU5w\">\r\n";
    log += "\t<uml:Model xmi:id=\"_FVrMgBwSEeaTcI5su2FfNw\" name=\"mapping\">\r\n";
    log += "\t\t<packagedElement xmi:type=\"uml:Package\" xmi:id=\"_FVrMgBwSEeaTcI5su2FfNe\" name=\"Imports\">\r\n";
    log += "\t\t\t<packageImport xmi:type=\"uml:PackageImport\" xmi:id=\"_FVrMgBwSEeaTcI5su2Ffnj\">\r\n";
    log += "\t\t\t\t<importedPackage xmi:type=\"uml:Model\" href=\""+ clientFileName + "#" + clientId + "\"/>\r\n";
    log += "\t\t\t</packageImport>\r\n";
    log += "\t\t\t<packageImport xmi:type=\"uml:PackageImport\" xmi:id=\"_FVrMgBwSEeaTcI5su2Ffnt\">\r\n";
    log += "\t\t\t\t<importedPackage xmi:type=\"uml:Model\" href=\""+ supplierFileName + "#" + supplierId + "\"/>\r\n";
    log += "\t\t\t</packageImport>\r\n";
    log += "\t\t</packagedElement>\r\n";
    log += "";
    log += "";
    log += "";
    log += "";
    log += "\t\t<packagedElement xmi:type=\"uml:Package\" xmi:id=\"_FVrMgBwSEeaTcI5su2Ffie\" name=\"Classes and Attributes\">\r\n";
    for(var i = 0; i < classCompare.length; i++){
    //for(var i = 0; i < classCompare.length; i++){
        client = classCompare[i].client;
        supplier = classCompare[i].supplier;
        comparison = "";
        var temp = 1;
        for(var j = 0; j < arrayClass.length; j++) {
            if (supplier[arrayClass[j]] != undefined || client[arrayClass[j]] != undefined) {
                if(arrayClass[j] == "status"){
                    postfix = "";
                }else{
                    postfix = "s";
                }
                if (supplier[arrayClass[j]] == client[arrayClass[j]]) {
                    comparison += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + client.id + "_Com" + temp++ + "\" annotatedElement=\"" + client.id + "_Pr\">\r\n";
                    if(arrayClass[j] == "visibility"){
                        comparison += "\t\t\t\t\t\t<body>visibilities are the same." + "</body>\r\n";
                    }else if(arrayClass[j] == "status"){
                        comparison += "\t\t\t\t\t\t<body>" + arrayClass[j] + postfix + " are the same." + "\r\n";
                        comparison += "\t\t\t\t\t\t\t\t\t\tSupplier : " + supplier[arrayClass[j]] + "\r\n";
                        comparison += "\t\t\t\t\t\t\t\t\t\tClient   : " + client[arrayClass[j]] + "\r\n";
                        comparison += "\t\t\t\t\t\t</body>\r\n";
                    }else{
                        comparison += "\t\t\t\t\t\t<body>" + arrayClass[j] + postfix + " are the same." + "</body>\r\n";
                    }
                    comparison += "\t\t\t\t\t</ownedComment>\r\n";
                } else {
                    comparison += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + client.id + "_Com" + temp++ + "\" annotatedElement=\"" + client.id + "_Pr\">\r\n";
                    if(arrayClass[j] == "visibility"){
                        comparison += "\t\t\t\t\t\t<body>visibilities are not same." + "\r\n";
                    }else{
                        comparison += "\t\t\t\t\t\t<body>" + arrayClass[j] + postfix + " are not same." + "\r\n";
                    }

                    comparison += "\t\t\t\t\t\t\t\t\t\tSupplier : " + supplier[arrayClass[j]] + "\r\n";
                    comparison += "\t\t\t\t\t\t\t\t\t\tClient   : " + client[arrayClass[j]] + "\r\n";
                    comparison += "\t\t\t\t\t\t</body>\r\n";
                    comparison += "\t\t\t\t\t</ownedComment>\r\n";
                }

            }
        }
        log += "\t\t\t<packagedElement xmi:type=\"uml:Package\" xmi:id=\"" + client.id + "_Pk\" name=\"" + client.name + "\">\r\n";
        log += "\t\t\t\t<packagedElement xmi:type=\"uml:Realization\" xmi:id=\"" + client.id + "_Pr\" name=\"" + client.name + "\">\r\n";
        log += comparison;
        log += "\t\t\t\t\t<client xmi:type=\"uml:Class\" href=\"" + client.fileName + "#" + client.id + "\"/>\r\n";
        log += "\t\t\t\t\t<supplier xmi:type=\"uml:Class\" href=\"" + supplier.fileName + "#" + supplier.id + "\"/>\r\n";
        log += "\t\t\t\t</packagedElement>\r\n";
        log += "\t\t\t\t<packagedElement xmi:type=\"uml:Package\" xmi:id=\"" + client.id + "_Apk\" name=\"Attributes of " + client.name + "\">\r\n";

        for(var j = 0; j < attributeCompare.length; j++){
            if(client.id == attributeCompare[j].clientClass.id){
                temp = 1;
                comparisonAtt = "";
                for(var k = 0; k < arrayAtt.length; k++){
                    if(attributeCompare[j].supplier[arrayAtt[k]] != undefined ||attributeCompare[j].client[arrayAtt[k]] != undefined){
                        //comparison += "\t\t\t" + array[k] + " : " + attributeCompare[j].supplier[array[k]] + "\t\t\t\t" + array[k] + " : " + attributeCompare[i].client[array[k]];
                        //array[k] = array[k].replace(/s$/g, "");
                        if(arrayAtt[k] == "isUses" || arrayAtt[k] == "status" || arrayAtt[k] == "units" || arrayAtt[k] == "min-elements" || arrayAtt[k] == "max-elements"){
                            postfix = "";
                        }else{
                            postfix = "s";
                        }
                        if(attributeCompare[j].supplier[arrayAtt[k]] == attributeCompare[j].client[arrayAtt[k]]){
                            //comparisonAtt += arrayAtt[k] + " same." + "\r\n";
                            //comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" name=\"" + arrayAtt[k] + "\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";

                            comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                            if(arrayAtt[k] == "status"){
                                comparison += "\t\t\t\t\t\t<body>" + arrayAtt[k] + postfix + " are the same." + "\r\n";
                                comparison += "\t\t\t\t\t\t\t\t\t\tSupplier : " + attributeCompare[j].supplier[arrayAtt[k]] + "\r\n";
                                comparison += "\t\t\t\t\t\t\t\t\t\tClient   : " + attributeCompare[j].client[arrayAtt[k]] + "\r\n";
                                comparison += "\t\t\t\t\t\t</body>\r\n";
                            }else{
                                comparisonAtt += "\t\t\t\t\t\t<body>" + arrayAtt[k] + postfix + " are the same." + "</body>\r\n";
                            }
                            comparisonAtt += "\t\t\t\t\t</ownedComment>\r\n";


                        }else{
                            //comparisonAtt += arrayAtt[k] + " not same." + "\r\n";
                            //comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" name=\"" + arrayAtt[k] + "\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                            comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                            //comparisonAtt += "\t\t\t\t\t<body>" + arrayAtt[k] + " not same." + "</body>\r\n";
                            comparisonAtt += "\t\t\t\t\t\t<body>" + arrayAtt[k] + postfix + " are not same." + "\r\n";
                            comparisonAtt += "\t\t\t\t\t\t\t\t\t\tSupplier : " + attributeCompare[j].supplier[arrayAtt[k]] + "\r\n";
                            comparisonAtt += "\t\t\t\t\t\t\t\t\t\tClient   : " + attributeCompare[j].client[arrayAtt[k]] + "\r\n";
                            comparisonAtt += "\t\t\t\t\t\t</body>\r\n";
                            comparisonAtt += "\t\t\t\t\t</ownedComment>\r\n";
                        }
                    }
                }


                if(attributeCompare[j].supplier.type != undefined ||attributeCompare[j].client.type != undefined){
                    if(typeof attributeCompare[j].supplier.type == "string" && typeof attributeCompare[j].client.type == "string"){
                        if(attributeCompare[j].supplier.type == attributeCompare[j].client.type){
                            //comparisonAtt += "type same.\r\n";
                            //comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" name=\"type\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                            comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                            comparisonAtt += "\t\t\t\t\t\t<body>types are the same." + "</body>\r\n";
                            comparisonAtt += "\t\t\t\t\t</ownedComment>\r\n";
                        }else{
                            //comparisonAtt += "type note same.\r\n";
                            //comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" name=\"type\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                            comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                            comparisonAtt += "\t\t\t\t\t\t<body>types are not same." + "</body>\r\n";
                            comparisonAtt += "\t\t\t\t\t</ownedComment>\r\n";
                        }
                    }
                    if(typeof attributeCompare[j].supplier.type == "object" && typeof attributeCompare[j].client.type == "object"){
                        // var typeMumber =["name", "range", "units", "path"];
                        var typeMumber =["name"];

                        for(var m = 0; m < typeMumber.length; m++){
                            if(attributeCompare[j].client.type[typeMumber[m]] != undefined || attributeCompare[j].supplier.type[typeMumber[m]] != undefined){
                                if(typeMumber[m] == "units"){
                                    postfix = "";
                                }else{
                                    postfix = "s";
                                }
                                if(attributeCompare[j].supplier.type[typeMumber[m]] == attributeCompare[j].client.type[typeMumber[m]]){
                                    //comparisonAtt += typeMumber[m] + " of type same." + "\r\n";
                                    //comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" name=\"" + typeMumber[m] + "\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                                    comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                                    comparisonAtt += "\t\t\t\t\t\t<body>" + typeMumber[m] + postfix + " of type are the same." + "</body>\r\n";
                                    comparisonAtt += "\t\t\t\t\t</ownedComment>\r\n";
                                }else{
                                    //comparisonAtt += typeMumber[m] + " of type not same." + "\r\n";
                                    //comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" name=\"" + typeMumber[m] + "\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                                    comparisonAtt += "\t\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + attributeCompare[j].client.id + "_Com" + temp++ + "\" annotatedElement=\"" + attributeCompare[j].client.id + "_Pr\">\r\n";
                                    comparisonAtt += "\t\t\t\t\t\t<body>" + typeMumber[m] + postfix + " of type are not same." + "\r\n";
                                    comparisonAtt += "\t\t\t\t\t\t\t\t\t\tSupplier : " + attributeCompare[j].supplier.type[typeMumber[m]] + "\r\n";
                                    comparisonAtt += "\t\t\t\t\t\t\t\t\t\tClient   : " + attributeCompare[j].client.type[typeMumber[m]] + "\r\n";
                                    comparisonAtt += "\t\t\t\t\t\t</body>\r\n";
                                    comparisonAtt += "\t\t\t\t\t</ownedComment>\r\n";
                                }
                            }
                        }
                    }
                }



                //comparisonAtt = comparisonAtt.replace(/\r\n$/g, '');
                //comparisonAtt = comparisonAtt.replace(/\r\n/g, '\r\n\t\t\t\t\t\t');
                log += "\t\t\t\t\t<packagedElement xmi:type=\"uml:Realization\" xmi:id=\"" + attributeCompare[j].client.id + "_Pr\" name=\"" + attributeCompare[j].client.name + "\">\r\n";
                log += "\t" + comparisonAtt;
                log += "\t\t\t\t\t\t<client xmi:type=\"uml:Property\" href=\"" + client.fileName + "#" + attributeCompare[j].client.id + "\"/>\r\n";
                log += "\t\t\t\t\t\t<supplier xmi:type=\"uml:Property\" href=\"" + supplier.fileName + "#" + attributeCompare[j].supplier.id + "\"/>\r\n";
                log += "\t\t\t\t\t</packagedElement>\r\n";
            }
        }
        log += "\t\t\t\t</packagedElement>\r\n";
        log += "\t\t\t</packagedElement>\r\n";

    }
    log += "\t\t</packagedElement>\r\n";

    log += "\t\t<packagedElement xmi:type=\"uml:Package\" xmi:id=\"_JarZQOKxEeSq5fATALSQkQ\" name=\"Associations\">\r\n";
    for(var i = 0; i < associationCompare.length; i++){
        temp = 1;
        comparison = "";
        client = associationCompare[i].client;
        supplier = associationCompare[i].supplier;
        for(var j = 0; j < arrayAssociation.length; j++) {
            if (supplier[arrayAssociation[j]] != undefined || client[arrayAssociation[j]] != undefined) {
                if (supplier[arrayAssociation[j]] == client[arrayAssociation[j]]) {
                    //comparison += "\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + client.id + "_Com" + temp++ + "\" name=\"" + arrayAssociation[j] + "\" annotatedElement=\"" + client.id + "_Pr\">\r\n";
                    comparison += "\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + client.id + "_Com" + temp++ + "\" annotatedElement=\"" + client.id + "_Pr\">\r\n";
                    comparison += "\t\t\t\t\t<body>" + arrayAssociation[j] + postfix + " are the same." + "</body>\r\n";
                    comparison += "\t\t\t\t</ownedComment>\r\n";
                } else {
                    //comparison += arrayAtt[k] + " not same." + "\r\n";
                    //comparison += "\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + client.id + "_Com" + temp++ + "\" name=\"" + arrayAssociation[j] + "\" annotatedElement=\"" + client.id + "_Pr\">\r\n";
                    comparison += "\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + client.id + "_Com" + temp++ + "\" annotatedElement=\"" + client.id + "_Pr\">\r\n";
                    comparison += "\t\t\t\t\t<body>" + arrayAssociation[j] + postfix + " are not same." + "</body>\r\n";
                    comparison += "\t\t\t\t</ownedComment>\r\n";
                }

            }
        }
        log += "\t\t\t<packagedElement xmi:type=\"uml:Realization\" xmi:id=\"" + client.id + "_Pr\" name=\"" + client.name + "\">\r\n";
        log += comparison;
        log += "\t\t\t\t<client xmi:type=\"uml:Association\" href=\"" + client.fileName + "#" + client.id + "\"/>\r\n";
        log += "\t\t\t\t<supplier xmi:type=\"uml:Association\" href=\"" + supplier.fileName + "#" + supplier.id + "\"/>\r\n";
        log += "\t\t\t</packagedElement>\r\n";
    }
    log += "\t\t</packagedElement>\r\n";

    //write realization between class and association.
    log += "\t\t<packagedElement xmi:type=\"uml:Package\" xmi:id=\"_FVrMgBwSEeaTcI5su2Ffif\" name=\"Realization between class and association.\">\r\n";
    for(var i = 0; i < classWithAssociation.length; i++){
        client = classWithAssociation[i].client;
        supplier = classWithAssociation[i].supplier;
        log += "\t\t\t<packagedElement xmi:type=\"uml:Realization\" xmi:id=\"" + client.id + "_Pr\" name=\"" + client.name + "\">\r\n";
        log += "\t\t\t\t<client xmi:type=\"uml:Association\" href=\"" + client.fileName + "#" + client.id + "\"/>\r\n";
        log += "\t\t\t\t<supplier xmi:type=\"uml:Class\" href=\"" + supplier.fileName + "#" + supplier.id + "\"/>\r\n";
        log += "\t\t\t</packagedElement>\r\n";
    }
    log += "\t\t</packagedElement>\r\n";

//write prunedClass

    log += "\t<packagedElement xmi:type=\"uml:Package\" xmi:id=\"_FVrMgBwSEeaTcI5su2Ffof\" name=\"prunedClass\">\r\n";


    for(var i = 0; i < prunedClass.length; i++){
        client = prunedClass[i];
        log += "\t\t\t<packagedElement xmi:type=\"uml:Realization\" xmi:id=\"" + client.id + "_Pr\" name=\"" + client.name +"\" client=\"_FVrMgBwSEeaTcI5su2Faof\">\r\n";
        log += "\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + client.id + "_Com" + temp++ + "\" annotatedElement=\"" + client.id + "_Pr\">\r\n";
        log += "\t\t\t\t\t<body>"+client.name+" is missing." + "</body>\r\n";
        log += "\t\t\t\t</ownedComment>\r\n";
        log += "\t\t\t\t<supplier xmi:type=\"uml:Class\" href=\"source.uml#" + client.id + "\"/>\r\n";
        log += "\t\t\t</packagedElement>\r\n";

    }
    log += "\t\t<packagedElement xmi:type=\"uml:Class\" xmi:id=\"_FVrMgBwSEeaTcI5su2Faof\" name=\"prunedClass\">\r\n";
    log += "\t\t<ownedAttribute xmi:type=\"uml:Property\" xmi:id=\"_FVrMgBwSEeaTcI5su2Ffaf\" name=\"prunedAttribute\">\r\n";
    log += "\t\t</ownedAttribute>\r\n";
    log += "\t\t</packagedElement>\r\n";
    log += "\t\t</packagedElement>\r\n";
   /* <packagedElement xmi:type="uml:Realization" xmi:id="_oGqm3FLNEeO75dO39GbF8Q_Pr" name="FdContainsFcs">
        <client xmi:type="uml:Association" href="target.uml#_oGqm3FLNEeO75dO39GbF8Q"/>
        <supplier xmi:type="uml:Association" href="source.uml#_oGqm3FLNEeO75dO39GbF8Q"/>
    </packagedElement>*/

//write prunedAttribute
    log += "\t<packagedElement  xmi:type=\"uml:Package\" xmi:id=\"_FVrMgBwSEeaTcI5su2Ffaf_Pk\" name=\"prunedAttribute\">\r\n";

    for(var i = 0; i < prunedAttribute.length; i++){

        log += "\t\t\t<packagedElement xmi:type=\"uml:Realization\" xmi:id=\"" + prunedAttribute[i].attid + "_Pr\" name=\"" + prunedAttribute[i].attname +"\" client=\"_FVrMgBwSEeaTcI5su2Ffaf\">\r\n";
        log += "\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + prunedAttribute[i].attid + "_Com" + temp++ + "\" annotatedElement=\"" + prunedAttribute[i].attid + "_Pr\">\r\n";
        log += "\t\t\t\t\t<body>"+prunedAttribute[i].name+":"+prunedAttribute[i].attname+" is missing." + "</body>\r\n";
        log += "\t\t\t\t</ownedComment>\r\n";
         log += "\t\t\t\t<supplier xmi:type=\"uml:Property\" href=\"source.uml#" +prunedAttribute[i].attid + "\"/>\r\n";
         log += "\t\t\t</packagedElement>\r\n";

    }
    log += "\t</packagedElement>\r\n";

    //write addedClass

    log += "\t<packagedElement xmi:type=\"uml:Package\" xmi:id=\"_FVrMgBwSEeaTcI5su3Ffof\" name=\"addedClass\">\r\n";


    for(var i = 0; i < addedClass.length; i++){
        client = addedClass[i];
        log += "\t\t\t<packagedElement xmi:type=\"uml:Realization\" xmi:id=\"" + client.id + "_Pr\" name=\"" + client.name +"\" client=\"_FVrMgBwSEeaTcI5su3Faof\">\r\n";
        log += "\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + client.id + "_Com" + temp++ + "\" annotatedElement=\"" + client.id + "_Pr\">\r\n";
        log += "\t\t\t\t\t<body>"+client.name+" is added." + "</body>\r\n";
        log += "\t\t\t\t</ownedComment>\r\n";
        log += "\t\t\t\t<supplier xmi:type=\"uml:Class\" href=\"target.uml#" + client.id + "\"/>\r\n";
        log += "\t\t\t</packagedElement>\r\n";

    }
    log += "\t\t<packagedElement xmi:type=\"uml:Class\" xmi:id=\"_FVrMgBwSEeaTcI5su3Faof\" name=\"addedClass\">\r\n";
    log += "\t\t<ownedAttribute xmi:type=\"uml:Property\" xmi:id=\"_FVrMgBwSEeaTcI5su3Ffaf\" name=\"addedAttribute\">\r\n";
    log += "\t\t</ownedAttribute>\r\n";
    log += "\t\t</packagedElement>\r\n";
    log += "\t\t</packagedElement>\r\n";

    //write addedAttribute
    log += "\t<packagedElement  xmi:type=\"uml:Package\" xmi:id=\"_FVrMgBwSEeaTcI5su3Ffaf_Pk\" name=\"addedAttribute\">\r\n";

    for(var i = 0; i < addedAttribute.length; i++){

        log += "\t\t\t<packagedElement xmi:type=\"uml:Realization\" xmi:id=\"" + addedAttribute[i].attid + "_Pr\" name=\"" + addedAttribute[i].attname +"\" client=\"_FVrMgBwSEeaTcI5su3Ffaf\">\r\n";
        log += "\t\t\t\t<ownedComment xmi:type=\"uml:Comment\" xmi:id=\"" + addedAttribute[i].attid + "_Com" + temp++ + "\" annotatedElement=\"" + addedAttribute[i].attid + "_Pr\">\r\n";
        log += "\t\t\t\t\t<body>"+addedAttribute[i].name+":"+addedAttribute[i].attname+" is added." + "</body>\r\n";
        log += "\t\t\t\t</ownedComment>\r\n";
        log += "\t\t\t\t<supplier xmi:type=\"uml:Property\" href=\"target.uml#" +addedAttribute[i].attid + "\"/>\r\n";
        log += "\t\t\t</packagedElement>\r\n";

    }
    log += "\t</packagedElement>\r\n";

//write profileApplication
    log += "\t\t<profileApplication xmi:type=\"uml:ProfileApplication\" xmi:id=\"_bty7UB5SEeaHceiWmTzrow\">\r\n";
    log += "\t\t\t<eAnnotations xmi:type=\"ecore:EAnnotation\" xmi:id=\"_cRbM0R5SEeaHceiWmTzrow\" source=\"PapyrusVersion\">\r\n";
    log += "\t\t\t\t<details xmi:type=\"ecore:EStringToStringMapEntry\" xmi:id=\"_cRbM0h5SEeaHceiWmTzrow\" key=\"Version\" value=\"0.2.2\"/>\r\n";
    log += "\t\t\t\t<details xmi:type=\"ecore:EStringToStringMapEntry\" xmi:id=\"_cRbM0x5SEeaHceiWmTzrow\" key=\"Comment\" value=\"Stereotypes extending more than one metaclass (Cond, Choice, PassedByReference) made optional.\"/>\r\n";
    log += "\t\t\t\t<details xmi:type=\"ecore:EStringToStringMapEntry\" xmi:id=\"_cRbM1B5SEeaHceiWmTzrow\" key=\"Copyright\" value=\"\"/>\r\n";
    log += "\t\t\t\t<details xmi:type=\"ecore:EStringToStringMapEntry\" xmi:id=\"_cRbM1R5SEeaHceiWmTzrow\" key=\"Date\" value=\"2016-02-26\"/>\r\n";
    log += "\t\t\t\t<details xmi:type=\"ecore:EStringToStringMapEntry\" xmi:id=\"_cRbM1h5SEeaHceiWmTzrow\" key=\"Author\" value=\"\"/>\r\n";
    log += "\t\t\t</eAnnotations>\r\n";
    log += "\t\t\t<eAnnotations xmi:type=\"ecore:EAnnotation\" xmi:id=\"_cRGcsB5SEeaHceiWmTzrow\" source=\"http://www.eclipse.org/uml2/2.0.0/UML\">\r\n";
    log += "\t\t\t\t<references xmi:type=\"ecore:EPackage\" href=\"../OpenModelProfile/OpenModel_Profile.profile.uml#_0tZP0NyQEeW6C_FaABjU5w\"/>\r\n";
    log += "\t\t\t</eAnnotations>\r\n";
    log += "\t\t\t<appliedProfile xmi:type=\"uml:Profile\" href=\"../OpenModelProfile/OpenModel_Profile.profile.uml#_m1xqsHBgEd6FKu9XX1078A\"/>\r\n";
    log += "\t\t</profileApplication>\r\n";

    log += "\t</uml:Model>\r\n";
    for(var i = 0;i < classCompare.length; i++){
        log += "\t<OpenModel_Profile:PruneAndRefactor xmi:id=\"" + classCompare[i].client.id + "_Pr2\" base_Realization=\"" + classCompare[i].client.id + "_Pr\"/>\r\n";
    }
    for(var i = 0;i < attributeCompare.length; i++){
        log += "\t<OpenModel_Profile:PruneAndRefactor xmi:id=\"" + attributeCompare[i].client.id + "_Pr2\" base_Realization=\"" + attributeCompare[i].client.id + "_Pr\"/>\r\n";
    }
    for(var i = 0;i < associationCompare.length; i++){
        log += "\t<OpenModel_Profile:PruneAndRefactor xmi:id=\"" + associationCompare[i].client.id + "_Pr2\" base_Realization=\"" + associationCompare[i].client.id + "_Pr\"/>\r\n";
    }
    for(var i = 0;i < classWithAssociation.length; i++){
        log += "\t<OpenModel_Profile:PruneAndRefactor xmi:id=\"" + classWithAssociation[i].client.id + "_Pr2\" base_Realization=\"" + classWithAssociation[i].client.id + "_Pr\"/>\r\n";
    }
    log += "\t<OpenModel_Profile:OpenModelClass xmi:id=\"_FVrMgBwSEeaTcI5su2Faof_Pr2\" base_Class=\"_FVrMgBwSEeaTcI5su2Faof\"/>\r\n";
    log += "\t<OpenModel_Profile:OpenModelAttribute xmi:id=\"_FVrMgBwSEeaTcI5su2Ffaf_Pr2\" base_StructuralFeature=\"_FVrMgBwSEeaTcI5su2Ffaf\"/>\r\n";
    for(var i = 0;i < prunedClass.length; i++){
        log += "\t<OpenModel_Profile:PruneAndRefactor xmi:id=\"" + prunedClass[i].id + "_Pr2\" base_Realization=\"" + prunedClass[i].id + "_Pr\"/>\r\n";
    }

    for(var i = 0;i < prunedAttribute.length; i++){
        log += "\t<OpenModel_Profile:PruneAndRefactor xmi:id=\"" + prunedAttribute[i].attid + "_Pr2\" base_Realization=\"" + prunedAttribute[i].attid + "_Pr\"/>\r\n";
    }
    for(var i = 0;i < addedClass.length; i++){
        log += "\t<OpenModel_Profile:PruneAndRefactor xmi:id=\"" + addedClass[i].id + "_Pr2\" base_Realization=\"" + addedClass[i].id + "_Pr\"/>\r\n";
    }
    for(var i = 0;i < addedAttribute.length; i++){
        log += "\t<OpenModel_Profile:PruneAndRefactor xmi:id=\"" + addedAttribute[i].attid + "_Pr2\" base_Realization=\"" + addedAttribute[i].attid + "_Pr\"/>\r\n";
    }

    //  <OpenModel_Profile:PruneAndRefactor xmi:id="_4uSigJ1PEeWJ0fWjnLbawA" base_Realization="_7WX0gJ1OEeWJ0fWjnLbawA"/>

    log += "</xmi:XMI>\r\n";
    log = log.replace(/\t/g, '  ');
    try{
        fs.writeFile("./project/" + path,log,function (error) {
            //fs.writeFile("./project/"+path,log,function (error) {
            if(error){
                console.log(error.stack);
                throw(error.message);
            }
        });
    }catch (e){
        console.log(e.stack);
        throw (e.message);
    }
    console.log("Write mapping.uml successful!");
}
function xmlWrite(){
    var path = "mappingXMlWRITER.uml";
    var xw = new xmlwriter;
    xw.startDocument('1.0','UTF-8')
    xw.startElement('xmi:XMI');
    xw.writeAttribute("xmi:version", "\"20131001\"");
    // xw.writeAttribute("xmlns:xmi", "http://www.omg.org/spec/XMI/20131001");
    // xw.writeAttribute("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
    // xw.writeAttribute("xmlns:OpenModel_Profile", "http:///schemas/OpenModel_Profile/_0tU-YNyQEeW6C_FaABjU5w/14");
    // xw.writeAttribute("xmlns:ecore", "http://www.eclipse.org/emf/2002/Ecore");
    // xw.writeAttribute("xmlns:uml", "http://www.eclipse.org/uml2/5.0.0/UML");
    // xw.writeAttribute("xsi:schemaLocation", "http:///schemas/OpenModel_Profile/_0tU-YNyQEeW6C_FaABjU5w/14 ../OpenModelProfile/OpenModel_Profile.profile.uml#_0tZP0NyQEeW6C_FaABjU5w");
    
    xw.startElement("uml:Model");
    xw.writeAttribute("xmi:id", "_FVrMgBwSEeaTcI5su2FfNw");
    xw.writeAttribute("name", "mapping");
    for(var i = 0; i < classCompare.length; i++){
        
    }
    

    xw.endElement();        //end [uml:Model]
    xw.endElement();        //end [xmi:Xmi]

    /*xw.writeAttribute("", "");
    xw.writeAttribute("", "");

    xw.startElement('root');
    xw.writeAttribute('foo', 'value');
    xw.text('Some content');*/
    xw.endDocument();

    //console.log(xw.toString());



    try{

        fs.writeFile("./project/mapping/" + path,xw.toString(),function (error) {
            //fs.writeFile("./project/"+path,log,function (error) {
            if(error){
                console.log(error.stack);
                throw(error.message);
            }
        });
    }catch (e){
        console.log(e.stack);
        throw (e.message);
    }

}
