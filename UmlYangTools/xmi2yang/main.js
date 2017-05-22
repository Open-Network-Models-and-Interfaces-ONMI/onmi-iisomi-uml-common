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
    fs = require('fs'),
    CLASS = require('./model/ObjectClass.js'),
    OpenModelObject = require('./model/OpenModelObject.js');
    assoc = require('./model/Association.js'),
    Node = require('./model/yang/node.js'),
    Feature = require('./model/yang/feature.js'),
    Uses = require('./model/yang/uses.js'),
    Module = require('./model/yang/module.js'),
    Type = require('./model/yang/type.js'),
    RPC = require('./model/yang/rpc.js'),
    Package = require('./model/yang/package.js'),
    Specify = require('./model/specify.js'),
    RootElement = require('./model/RootElement.js'),
    Abstraction = require('./model/yang/abstraction.js'),
    Augment = require('./model/yang/augment.js');

var Typedef = [];//The array of basic DataType and PrimitiveType
var Identity=[];
var Class = [];//The array of objcet class
var openModelAtt = [];//The array of openmodelprofile
var openModelclass = [];//The array of openmodelprofile
var openModelnotification = [];
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
var generalization = [];
var abstraction=[];
var specify=[];
var rootElement=[];
var augment = [];
var config = {};


var result = main_Entrance();

function main_Entrance(){
    try{
        createKey(function(flag){
            if(!flag){
                console.log("There is no 'key.cfg' file,please config 'key' first!");
            }
            fs.readdir("./project/", function(err, files){
                if(err){
                    console.log(err.stack);
                    throw err.message;
                } else{
                    var num = 0;
                    if(fs.existsSync("./project/config.txt")){
                        readConfig();
                    }else{
                        console.warn("Warning: There is no config.txt in the project folder.Please recheck you files.");
                        throw (e);
                    }
                    for(var i = 0; i < files.length; i++){
                        var allowedFileExtensions = ['xml', 'uml'];
                        var currentFileExtension = files[i].split('.').pop();
                        if(allowedFileExtensions.indexOf(currentFileExtension) !== -1) {   //match postfix of files
                            currentFileName = files[i];
                            num++;
                            parseModule(files[i]);
                        }
                    }
                    currentFileName = undefined;
                    if(!num){
                        console.log("There is no .xml file in 'project' directory! Please check your files path");
                    }else{
                        //addKey();//deal with the key for every class
                        //if the class's value of aggregation is opposite,the class don't need to be instantiated individually
                        buildGeneralization(Class);

                        for(var i = 0; i < generalization.length; i++) {
                            inheritKey(generalization[i]);
                        }
                        for(var i = 0; i < Class.length; i++){
                            pflag = Class[i].id;
                            var path = addPath(Class[i].id, Class[i]);

                            if(path === undefined){
                                if(Class[i].key.array){
                                    Class[i].instancePath = Class[i].fileName.split('.')[0] + ":" + Class[i].name + "/" + Class[i].fileName.split('.')[0] + ":" + Class[i].key.join(" ");
                                }else{
                                    if(Class[i].key !== ""){
                                        Class[i].instancePath = Class[i].fileName.split('.')[0] + ":" + Class[i].name + "/" + Class[i].fileName.split('.')[0] + ":" + Class[i].key;
                                    }else{
                                        Class[i].instancePath = Class[i].fileName.split('.')[0] + ":" + Class[i].name + "/";
                                    }
                                }
                            }else{
                                Class[i].isGrouping = true;
                                var fileName;
                                if(Class[i].instancePathFlag === true){
                                    fileName = Class[i].fileName.split(".")[0];
                                }else{
                                    fileName = path.split("/")[path.split("/").length - 1].split(":")[0];
                                }
                                if(Class[i].key.array) {
                                    Class[i].instancePath = path + "/" + fileName + ":" + Class[i].key.join(" ");
                                }else{
                                    if(Class[i].key !== "") {
                                        Class[i].instancePath = path + "/" + fileName + ":" + Class[i].key;
                                    }else{
                                        Class[i].instancePath = path + "/";
                                    }
                                }
                            }
                        }
                        for(var i = 0; i < Class.length; i++){
                            if(Class[i].type === "DataType" && Class[i].nodeType === "grouping" && Class[i].generalization.length === 0){
                                if(Class[i].attribute.length === 1){
                                    if(!Class[i].attribute[0].isUses){
                                        Class[i].nodeType = "typedef";
                                        Class[i].type = Class[i].attribute[0].type;
                                        Class[i].attribute = [];
                                        Typedef.push(Class[i]);
                                    }else{
                                        if(!(Class[i].attribute[0].nodeType === "list" || Class[i].attribute[0].nodeType === "container")){
                                            var t = datatypeExe(Class[i].attribute[0].type);
                                            switch (t.split(",")[0]){
                                                case "enumeration":
                                                    Class[i].attribute = Class[t.split(",")[1]].attribute;
                                                    var a = Class[t.split(",")[1]].generalization;
                                                    if(a.length > 0){
                                                        for(var j = 0; j < a.length; j++){
                                                            for(var k = 0; k < Class.length; k++){
                                                                if(a[j] === Class[k].id){
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
                                                default:
                                                    break;
                                            }
                                            Class[i].nodeType = t.split(",")[0];
                                        }
                                    }
                                }
                            }
                            for(var j = 0; j < openModelclass.length; j++) {
                                if(openModelclass[j].id === Class[i].id){
                                    if(openModelclass[j].condition){
                                        Class[i].support = openModelclass[j].support;
                                    }
                                    if(openModelclass[j].status){
                                        Class[i].status = openModelclass[j].status;
                                    }
                                    break;
                                }
                            }
                        }
                        classspec(abstraction);
                        for(var i = 0; i < augment.length; i++){
                            for(var  j = 0; j < yangModule.length; j++){
                                if(augment[i].fileName == yangModule[j].fileName){
                                    yangModule[j].children.push(augment[i]);
                                }
                            }
                        }
                        for(var i = 0; i < Identity.length; i++){
                            for(var  j = 0; j < packages.length; j++){
                                if(Identity[i].fileName == packages[j].fileName && packages[j].name.toLowerCase()=="typedefinitions"){
                                    packages[j].children.push(Identity[i]);
                                }
                            }
                        }
                        for(var i = 0; i < Class.length; i++){
                            path = Class[i].instancePath;
                            for(var j = 0; j < augment.length; j++){
                                if(augment[j].client === path.split('/')[0].split(":")[1]){
                                    if(Class.instancePathFlag !== false){
                                        Class.instancePathFlag = true; // [sko] shall it be " = " only?
                                    }
                                    Class[i].instancePath = path.replace(path.split('/')[0], augment[j].supplier);
                                    break;
                                }
                            }
                        }
                        obj2yang(Class);//the function is used to mapping to yang
                        // print every yangModules whose children attribute is not empty to yang files.
                        crossRefer(yangModule);
                        for(var i = 0; i < yangModule.length; i++) {
                            if (yangModule[i].children.length > 0) {
                                (function () {
                                    try {
                                        var st = writeYang(yangModule[i]);//print the module to yang file
                                        var path = './project/' + yangModule[i].name + '.yang';
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
                        }
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
                if(typeof config[key] === "string"){
                    config[key] = config[key].replace(/<br>/g, "\r\n");
                }else if(typeof config[key] === "object"){
                    for(var keykey in config[key]){
                        if(typeof config[key][keykey] === "string"){
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
                    if(date.match(reg) === null){
                        console.warn("The revision date is not in the correct format (yyyy-mm-dd), please check the config.txt file.");
                        throw (e1);
                    }
                    if(dateArray[1] > 12 || dateArray[1] < 1){
                        console.warn("The month of revision date is invalid, please check the config.txt file.");
                        throw (e1);
                    }
                    if(dateArray[2] > day[dateArray[1]] || dateArray[2] < 1) {
                        if (!(dateArray[0] % 4 === 0 && dateArray[1] === 2 && dateArray[2] === 29)) {
                            console.warn("The revision date is invalid, day is not consistent with month. Please check the config.txt file");
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
                            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                        return fmt;
                    };
                    var currentData = new Date().Format("yyyy-MM-dd");
                    config.revision.date = currentData;
                }
                /*if(!date){
                }
                else if(dateArray[1] < 13 && dateArray[2] > day[dateArray[1]]){
                    if(!(dateArray[0] % 4 === 0 && dateArray[1] === 2 && dateArray[2] === 29)){
                        console.warn("The revision date is invalid, the month is not consistent with data. Please check the config.txt file.")
                        throw (e1);
                    }
                    /!*if(parseInt(date.split("-")[0]) > parseInt(currentData.split("-")[0])){
                        console.warn("The revision date is invalid (later than current date or wrong number), please check the config.txt file.")
                        throw (e1);
                    }else if(parseInt(date.split("-")[0]) === parseInt(currentData.split("-")[0]) && parseInt(date.split("-")[1]) > parseInt(currentData.split("-")[1])){
                        console.warn("The revision date is invalid (later than current date or wrong number), please check the config.txt file.")
                        throw (e1);
                    }else if(parseInt(date.split("-")[0]) === parseInt(currentData.split("-")[0]) && parseInt(date.split("-")[1]) === parseInt(currentData.split("-")[1]) && parseInt(date.split("-")[2]) > parseInt(currentData.split("-")[2])){
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

var pflag;
function addPath(id, Class){
    var path,
        temp;
    for(var i = 0; i < isInstantiated.length; i++){
        if(id === isInstantiated[i].id){
            if(isInstantiated[i].tpath){
                path = isInstantiated[i].tpath;
            }else {
                if (isInstantiated[i].pnode === pflag) {
                    console.warn("Warning:xmi:id=" + pflag + " and xmi:id=" + isInstantiated[i].id + " have been found cross composite!");
                    return path;
                }
                path = isInstantiated[i].path;
                temp = addPath(isInstantiated[i].pnode, Class);
                if (temp !== undefined) {
                    path = path.split("/")[1];
                    path = temp + '/' + path;
                } else {
                    isInstantiated[i].tpath = path;
                }
            }
            if(path){
                Class.instancePathFlag = false;
            }
           /* for(var j = 0; j < augment.length; j++){
                if(augment[j].client === path.split('/')[0].split(":")[1]){
                    if(Class.instancePathFlag !== false){
                        Class.instancePathFlag == true; // [sko] shall it be " = " only?
                    }
                    path = path.replace(path.split('/')[0], augment[j].supplier);
                    break;
                }
            }*/
            return path;
        }
    }
    /*if(i === isInstantiated.length){
        for(var j = 0; j < augment.length; j++){
            if(augment[j].id === id && Class.fileName === augment[j].fileName){
                if(Class.instancePathFlag !== false){
                    Class.instancePathFlag == true; // [sko] shall it be " = " only?
                }
                path = augment[j].supplier;
                break;
            }
        }
        return path;
    }*/
}

function addKey(){
    for(var i = 0; i < Class.length; i++){
        var flag = 0;
        //search every class,if class's generalization's value is keylist's id,the class will have a key
        if (Class[i].generalization.length !== 0) {
            for(var j = 0; j < Class[i].generalization.length; j++){
                for(var k = 0; k < Class.length; k++){
                    if(Class[k].id === Class[i].generalization[j]){
                        if(Class[k].isAbstract && Class[k].key.length !== 0){
                            //Array.prototype.push.apply(Class[i].key, Class[k].key);
                            //Class[i].key = Class[i].key.concat(Class[k].key);
                            for(var m = 0; m < Class[k].key; m++){
                                Class[i].key.push(Class[k].key[m]);
                            }
                        }
                        break;
                    }
                }
            }
        }
        if(Class[i].key.length > 0){
            Class[i].key = Class[i].key.join(" ");
        }
        //if(flag === 0 && Class[i].config){
          //  Class[i].key = "localId";
        //}
       /*for(var j = 0; j < keylist.length; j++){
           if(keylist[j].id === Class[i].name){
               Class[i].key = keylist[j].name;
               break;
           }
       }*/
    }
}

function buildGeneralization(Class){
    var gen = {};
    for(var i = 0; i < Class.length; i++){
        for(var j = 0; j < Class[i].generalization.length; j++){
            for(var k = 0; k < Class.length; k++){
                if(Class[i].generalization[j] === Class[k].id){
                    for(var m = 0; m < generalization.length; m++){
                        if(generalization[m].class1.id === Class[i].id && generalization[m].class2.id === Class[k].id && generalization[m].class1.fileName === Class[i].fileName && generalization[m].class2.fileName === Class[k].fileName){
                            break;
                        }
                    }
                    if(m === generalization.length){
                        var gen = {};
                        gen.class1 = Class[i];
                        gen.class2 = Class[k];
                        generalization.push(gen);
                        break;
                    }
                }
            }
        }
    }
}

function inheritKey(general) {
    var keyLength,
        newnode,
        newkey,
        newkeyid,
        newkeyvalue;
    if(general.class2.key.length !== 0){
        keyLength = general.class2.key instanceof Array ? general.class2.key.length : 1;
        for(var i = 0; i < keyLength; i++){
            newkey = keyLength === 1 ? general.class2.key : general.class2.key[i];
            newkeyid = keyLength === 1 ? general.class2.keyid : general.class2.keyid[i];
            newkeyvalue = keyLength === 1 ? general.class2.keyvalue : general.class2.keyvalue[i];
            if(general.class2.key instanceof Array){
                newkey = general.class2.key[0];
                newkeyid = general.class2.keyid[0];
                newkeyvalue = general.class2.keyvalue[0];
            }
            for(var j = 0; j < general.class1.key.length; j++){
                if(newkeyid === general.class1.keyid[j]){
                    break;
                }
            }
            if(j === general.class1.key.length){
                general.class1.key.push(newkey);
                general.class1.keyid.push(newkeyid);
                general.class1.keyvalue.push(newkeyvalue);
                inherit(general.class1, newkey, newkeyid,newkeyvalue);
            }

        }
    }
}

function inherit(Class, key, keyid,keyvalue){
    for(var i = 0; i < generalization.length; i++){
        if(generalization[i].class2.id === Class.id && generalization[i].class2.fileName === Class.fileName){
            for(var j = 0; j < generalization[i].class1.key.length; j++){
                if(keyid === generalization[i].class1.keyid[j]){
                    break;
                }
            }
            if(j === generalization[i].class1.key.length){
                generalization[i].class1.key.push(key);
                generalization[i].class1.keyid.push(keyid);
                generalization[i].class1.keyvalue.push(keyvalue);

                inherit(generalization[i].class1, key, keyid,keyvalue);
            }

        }
    }
}

function crossRefer(mod){
    var flag = 0;
    for(var i = 0; i < mod.length; i++){
        for(var j = 0; j < mod[i].import.length; j++){
            for(var k = i + 1; k < mod.length; k++){
                if(mod[k].name === mod[i].import[j]){
                    for(var q = 0; q < mod[k].import.length; q++){
                        if(mod[k].import[q] === mod[i].name){
                            console.warn("Warning:module " + mod[i].name + " and module " + mod[k].name + " have been found cross reference!");
                            flag = 1;
                            break;
                        }
                    }
                }
                if(flag === 1){
                    break;
                }
            }
            if(flag === 1){
                break;
            }
        }
        flag = 0;
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

function parseModule(filename){                     //XMLREADER read xml files
    var xml = fs.readFileSync("./project/" + filename, {encoding: 'utf8'});
    xmlreader.read(xml,function(error, model) {
        if (error) {
            console.log('There was a problem reading data from ' + filename + '. Please check your xmlreader module and nodejs!\t\n' + error.stack);
        } else {
            console.log(filename + " read successfully!");
            var xmi;
            var flag = 0;
            var newxmi;
            if(model["xmi:XMI"]){                   //model stores what XMLREADER read
                xmi = model["xmi:XMI"];            //xmi:the content of xmi:XMI object in model
                var obj;
                for(var key in xmi){                            //key:the child node of xmi
                    switch(key.split(":")[1]){
                        case "OpenModelAttribute":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];      //newxmi: the array in OpenModel_Profile:OpenModelAttribute
                            var len = xmi[key].array ? xmi[key].array.length : 1;     //OpenModel_Profile:the number of array object in OpenModelAttribute
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parseOpenModelatt(obj);
                            }
                            break;
                        case "OpenModelClass":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parseOpenModelclass(obj);
                            }
                            break;
                        case "OpenModelNotification":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parseOpenModelnotification(obj);
                            }
                            break;
                        case "OpenModelParameter":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parseOpenModelatt(obj);
                            }
                            break;
                        case "Preliminary":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                //createLifecycle(obj, "current");
                                createLifecycle(obj, "Preliminary");
                            }
                            break;
                        case "Mature":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                createLifecycle(obj, "current");
                            }
                            break;
                        case "Obsolete":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                createLifecycle(obj, "obsolete");
                            }
                            break;
                        case "Deprecated":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                createLifecycle(obj, "deprecated");
                            }
                            break;
                        case "Experimental":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                //createLifecycle(obj, "deprecated");
                                createLifecycle(obj, "Experimental");
                            }
                            break;
                        case "Example":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                createLifecycle(obj, "Example");
                            }
                            break;
                        case "LikelyToChange":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                //createLifecycle(obj, "deprecated");
                                createLifecycle(obj, "LikelyToChange");
                            }
                            break;
                        case "PassedByReference":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                obj.psBR = true;
                                parseOpenModelatt(obj);
                            }
                            break;
                        case "Specify":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];

                                parseSpec(obj);/*specify.push(obj.attributes().base_Abstraction);
                                 target.push(obj.attributes().target);*/
                            }
                            break;
                        case "RootElement":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parseRootElement(obj);
                            }
                            break;
                        /*case "SpecReference":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                specReference.push(obj.attributes().base_StructuralFeature);
                            }
                            break;
                        case "DefinedBySpec":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                definedBySpec.push(obj.attributes().base_StructuralFeature);
                            }
                            break;*/
                        default :
                            break;
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
                        default :
                            break;
                    }
                }
                if(flag === 0){
                    console.log("Can not find the tag 'uml:Package' or 'uml:Model' of" + filename + "! Please check out the xml file");
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
            console.log("Parse " + filename + " successfully!");
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
    if (xmi.ownedComment) {
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
    if(config.prefix === "" || config.prefix === null || config.prefix === undefined) {
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
        if (xmi.ownedComment) {
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
           if(xmi.ownedOperation){
               xmi.ownedOperation.array ? len = xmi.ownedOperation.array.length : len = 1;
               for(var i = 0; i < len; i++){
                   len == 1 ? newxmi = xmi.ownedOperation : newxmi = xmi.ownedOperation.array[i];
                   createClass(newxmi, "rpc");
               }
           }
        }

    }else{
        createElement(xmi);
    }
}

function parseOpenModelatt(xmi){
    var flag = 0;
    var id;
    if(xmi.attributes().base_StructuralFeature){
        id = xmi.attributes().base_StructuralFeature
    }else if(xmi.attributes().base_Parameter){
        id = xmi.attributes().base_Parameter
    }
    else if(xmi.attributes().base_Property){
        id = xmi.attributes().base_Property
    }
    else{
        return;
    }
    var cond;
    var sup;
    if(xmi.attributes()["condition"] && xmi.attributes()["condition"]!="none"){
        cond = xmi.attributes()["condition"].replace(/[ =]/g, '-').replace(/\./g, '').toLowerCase();
        if(xmi.attributes()["support"]){
            sup = xmi.attributes()["support"];
            flag = 1;
        }
        flag = 1;
    }
    var passBR;
    if(xmi.psBR == true){
        passBR=true;
        flag=1;
    }
    var vr;
    //if(xmi.attributes()["valueRange"]&&xmi.attributes()["valueRange"]!="NA"&&xmi.attributes()["valueRange"]!="See data type"){
    if(xmi.attributes()["valueRange"] && xmi.attributes()["valueRange"] !== "null" && xmi.attributes()["valueRange"] !== "NA" && xmi.attributes()["valueRange"] !== "See data type" && xmi.attributes()["valueRange"] !== "See data type."){

        vr = xmi.attributes()["valueRange"];
        flag = 1;
    }
    var units;
    if(xmi.attributes()["unit"]){
        units = xmi.attributes()["unit"];
        flag = 1;
    }
    var key;
    if(xmi.attributes()["partOfObjectKey"] && xmi.attributes()["partOfObjectKey"]!="0"){
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
            if(openModelAtt[i].id == id){
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
    if(xmi.attributes().base_Class){
        id = xmi.attributes().base_Class
    }else if(xmi.attributes().base_Operation){
        id = xmi.attributes().base_Operation;
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
    if(xmi.attributes()["condition"] && xmi.attributes()["condition"] !== "none"){
        cond = xmi.attributes()["condition"].replace(/[ =]/g, '-').replace(/\./g, '').toLowerCase();;
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
            if(openModelclass[i].id == id){
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

function parseOpenModelnotification(xmi){
    var id;
    if(xmi.attributes()["base_Signal"]){
        id = xmi.attributes()["base_Signal"];
    }
    openModelnotification.push(id);
}

function createLifecycle(xmi, str){              //创建lifecycle
    var id;
    var nodetype;
    if(xmi.attributes().base_Parameter){
        id = xmi.attributes().base_Parameter;
        nodetype = "attribute";
    }else if(xmi.attributes().base_StructuralFeature){
        id = xmi.attributes().base_StructuralFeature;
        nodetype = "attribute";
    }else if(xmi.attributes().base_Operation){
        id = xmi.attributes().base_Operation;
        nodetype = "class";
    }else if(xmi.attributes().base_Class){
        id = xmi.attributes().base_Class;
        nodetype = "class";
    }else if(xmi.attributes().base_DataType){
        id = xmi.attributes().base_DataType;
        nodetype = "class";
    }else if(xmi.attributes().base_Element){
        id = xmi.attributes().base_Element;
        nodetype = "attribute";   //attribute or class
    }else{
        return;
    }
    if(nodetype == "class"){
        for(var i = 0; i < openModelclass.length; i++){
            if(openModelclass[i].id == id){
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
            if(openModelAtt[i].id == id){
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

function parseSpec(xmi) {
    var id;
    if(xmi.attributes()["base_Abstraction"]){
        id = xmi.attributes()["base_Abstraction"];
    }
    var target;
    if(xmi.attributes()["target"]){
        target = xmi.attributes()["target"];
    }else if(xmi["target"]){
        target = xmi["target"];
    }
    var tempspec = new Specify(id,target,currentFileName);
    specify.push(tempspec);
}

function parseRootElement(xmi) {
    var id;
    if(xmi.attributes()["base_Class"]){
        id = xmi.attributes()["base_Class"];
    }
    var name;
    if(xmi.attributes()["name"]){
        name = xmi.attributes()["name"];
    }
    var multiplicity;
    if(xmi.attributes()["multiplicity"]){
        multiplicity = xmi.attributes()["multiplicity"];
    }
    var description;
    if(xmi.attributes()["description"]){
        description = xmi.attributes()["description"];
    }
    var tempRE = new RootElement(id,name,multiplicity,description,currentFileName);
    rootElement.push(tempRE);
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
                    if (xmi.ownedComment) {
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
                        case "uml:Association":
                            createAssociation(obj);
                            break;
                        case "uml:Signal":
                            createClass(obj, "notification");
                            break;
                        case "uml:Abstraction":
                            createAbstraction(obj);
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
        if (obj.ownedComment) {
            var comment = parseComment(obj);

            /*var len;
            var comment = "";
            obj.ownedComment.array ? len = obj.ownedComment.array.length : len = 1;
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
        if(node.nodeType == "notification"){
            for(var j = 0; j < openModelnotification.length; j++){
                if(openModelnotification[j] == node.id)
                    break;
            }
            if(j == openModelnotification.length){
                node.nodeType == "grouping";
                node.isAbstract == true;
            }
        }
        if (obj.attributes().isAbstract == "true") {
            node.isAbstract = true;
        }
        if (obj.attributes().isLeaf == "true") {
            node.isLeaf = true;
        }
        if (obj['generalization']) {
            var len;
            obj['generalization'].array ? len = obj['generalization'].array.length : len = 1;
            for (var i = 0; i < len; i++) {
                var gen;
                len == 1 ? gen = obj['generalization'] : gen = obj['generalization'].array[i];
                node.buildGeneral(gen);
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
                var id = att.attributes()["xmi:id"];
               /* var specTargetFlag = false;
                var specReferenceFlag = false;
                var definedBySpecFlag = false;
                for(var j = 0; j < specTarget.length; j++){
                    if(id == specTarget[j]){
                        specTargetFlag = true;
                        Grouping.push(node.id);
                        var name ;
                        if(att.defaultValue) {
                            if(att.defaultValue.attributes().value){
                                name = att.defaultValue.attributes().value;
                                var newnode = new Augment(name, id, node.name, node.id, "", currentFileName);
                                augment.push(newnode);
                            }else{
                                console.warn("Warning: the value of xmi:id=\"" + id + "\" doesn't exist! Please recheck your uml file.")
                            }
                        }
                        break;
                    }
                }*/
               /* for(var j = 0; j < specReference.length; j++){
                    if(id == specReference[j]){
                        specReferenceFlag = true;
                        break;
                    }
                }
                for(var j = 0; j < definedBySpec.length; j++){
                    if(id == definedBySpec[j]){
                        definedBySpecFlag = true;
                        break;
                    }
                }*/
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
                    if(node.attribute[i].nodeType == "list"){
                        for(var j = 0; j < association.length; j++){
                            if(r == association.name){
                                break;
                            }
                        }
                        if(j == association.length){
                            var a = new assoc(r, node.attribute[i].id, "list", node.attribute[i].upperValue, node.attribute[i].lowerValue);
                            association.push(a);
                        }
                    }
                    //add "path"
                    for(var k = 0; k < openModelAtt.length; k++){
                        if(openModelAtt[k].id == node.attribute[i].id){
                            if(openModelAtt[k].passedByReference){
                                node.attribute[i].isleafRef = true;
                                break;
                            }
                            else if(openModelAtt[k].passedByReference == false){
                                node.attribute[i].isleafRef = false;
                                break;
                            }
                            if(openModelAtt[k].key){
                                //att.attributes().name? node.key[openModelAtt[k].key-1]=att.attributes().name:null;
                                if(att.attributes().name){
                                    var tempName = att.attributes().name;
                                    tempName = tempName.replace(/^[^A-Za-z|_]+|[^A-Za-z|_\d]+$/g, "");
                                    tempName = tempName.replace(/[^\w\.-]+/g, '_');
                                    node.key.push(tempName);
                                    node.keyid.push(att.attributes()["xmi:id"]);
                                    node.keyvalue.push(openModelAtt[k].key);
                                }
                            }
                        }
                    }
                    if(!node.attribute[i].isleafRef && node.type == "Class"){
                        var instance = {};
                        instance.id = r;
                        instance.pnode = node.id;
                        instance.fileName = node.fileName;
                        instance.path = node.fileName.split('.')[0] + ":" + node.name + "/" + node.attribute[i].fileName.split('.')[0] + ":" +node.attribute[i].name;
                        if(r == node.id){
                            instance.tpath = instance.path;
                            console.warn("Warning:xmi:id=" + r + " can not be compositeed by itself!");
                        }
                        isInstantiated.push(instance);
                    }
                }else{
                    for(var k = 0; k < openModelAtt.length; k++){
                        if(openModelAtt[k].id == node.attribute[i].id){
                            if(openModelAtt[k].key){
                                //att.attributes().name? node.key[openModelAtt[k].key-1]=att.attributes().name:null;
                                if(att.attributes().name){
                                    var tempName = att.attributes().name;
                                    tempName = tempName.replace(/^[^A-Za-z|_]+|[^A-Za-z|_\d]+$/g, "");
                                    tempName = tempName.replace(/[^\w\.-]+/g, '_');
                                    node.key.push(tempName);
                                    node.keyid.push(att.attributes()["xmi:id"]);
                                    node.keyvalue.push(openModelAtt[k].key);
                                }
                            }
                        }
                    }
                }
//                if (definedBySpecFlag == true) {
//                    node.attribute[i].isDefinedBySpec = true;
//                }
               /* if(specTargetFlag == true) { // && node.name !== "ExtensionsSpec"){
                    node.attribute[i].isSpecTarget = true;
                    node.isSpec = true;
                }
                if(specReferenceFlag == true) { // && node.name !== "ExtensionsSpec"){
                    node.attribute[i].isSpecReference = true;
                    node.isSpec = true;
                }*/
                //search the "keyId",if r is the value of "keyId",add this node to keyList
                /*for (var j = 0; j <keyId.length; j++) {
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
            if(node.isLeaf == true){
            node.buildEnum(obj);
                Typedef.push(node);
            } else{
            node.buildIdentityref(obj);
            Typedef.push(node);


                    var nodeI = new Node(name,"","identity");
                    nodeI.fileName=node.fileName;
                    Identity.push(nodeI);
                    var literal = obj["ownedLiteral"];
                    var enumComment;
                    var enumValue;
                    var enumNode;
                    if(literal == undefined){
                        return;
                    }
                    if (literal.array != undefined) {
                        for (var i = 0; i < literal.array.length; i++) {
                            enumValue = literal.array[i].attributes().name;
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
                            enumNode = new Node(enumValue, enumComment, "identity");
                            var baseNode=new Node(name, "", "base");
                            enumNode.fileName = node.fileName;
                            enumNode.children.push(baseNode);
                            Identity.push(enumNode);
                        }
                    } else {
                        enumValue = literal.attributes().name;
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
                        enumNode = new Node(enumValue, enumComment, "identity");
                        var baseNode=new Node(name, enumComment, "base");
                        enumNode.fileName = node.fileName;
                        enumNode.children.push(baseNode);
                        Identity.push(enumNode);
                    }
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
            }
        }
        if (nodeType == "dataType") {
            node.isGrouping = true;
            if(node.attribute.length == 0 && node.generalization.length == 0){
                nodeType = "typedef";
                node.nodeType = "typedef";
            }else{
                node.nodeType="grouping";
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
            obj['ownedParameter'].array ? len = obj['ownedParameter'].array.length :len = 1;
            for (var i = 0; i < len; i++) {
                var para;
                len == 1 ? para = obj['ownedParameter'] : para = obj['ownedParameter'].array[i];
                r = node.buildOperate(para);

                if (r !== "basicType") {
                    for (var k = 0; k < Grouping.length; k++) {
                        if (Grouping[j] == r) {
                            break;
                        }
                    }
                    if (k == Grouping.length) {
                        Grouping.push(r);
                    }
                    if(node.attribute[i].nodeType == "list"){
                        for(var j = 0; j < association.length; j++){
                            if(r == association.name){
                                break;
                            }
                        }
                        if(j == association.length){
                            var a = new assoc(r, node.attribute[i].id, "list", node.attribute[i].upperValue, node.attribute[i].lowerValue);
                            association.push(a);
                        }
                    }
                    for(var k = 0; k < openModelAtt.length; k++){
                        if(openModelAtt[k].id == node.attribute[i].id){
                            if(openModelAtt[k].passedByReference){
                                node.attribute[i].isleafRef = true;
                                break;
                            }
                            else if(openModelAtt[k].passedByReference == false){
                                node.attribute[i].isleafRef = false;
                                break;
                            }
                            if(openModelAtt[k].key){
                                if(att.attributes().name){
                                    var tempName = att.attributes().name;
                                    tempName = tempName.replace(/^[^A-Za-z|_]+|[^A-Za-z|_\d]+$/g, "");
                                    tempName = tempName.replace(/[^\w\.-]+/g, '_');
                                    node.key.push(tempName);
                                    node.keyid.push(att.attributes()["xmi:id"]);
                                    node.keyvalue.push(openModelAtt[k].key);
                                }
                            }
                        }
                    }
                }
                for(var k = 0; k < openModelAtt.length; k++){
                    if(openModelAtt[k].id == node.attribute[i].id){
                        if(openModelAtt[k].key){
                            if(att.attributes().name){
                                var tempName = att.attributes().name;
                                tempName = tempName.replace(/^[^A-Za-z|_]+|[^A-Za-z|_\d]+$/g, "");
                                tempName = tempName.replace(/[^\w\.-]+/g, '_');
                                node.key.push(tempName);
                                node.keyid.push(att.attributes()["xmi:id"]);
                                node.keyvalue.push(openModelAtt[k].key);
                            }
                        }
                    }
                }
            }
        }
        //if(node.key == undefined){
        //    node.key = "localId";
        //}
        /*if(node.nodeType == "grouping"){
            //node.name = "G_" + node.name;
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

function createAssociation(obj) {
    var ele;
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
    }
}

function createAbstraction(obj) {
    var id = obj.attributes()["xmi:id"];
    var client = "",
        supplier = "",
        clientid,
        comment = "",
        temp;
    if (obj.attributes()["client"]) {
        clientid = obj.attributes()["client"];
    } else {
        console.log("Warning: The client of " + id + " does not exist!");
    }
    if (obj.ownedComment) {
        comment = parseComment(obj);
    }
    for (var k = 0; k < specify.length; k++) {
        if (specify[k].id == id && specify[k].fileName == currentFileName ) {
            if (specify[k].target && specify[k].target.length > 0) {
                var tar = specify[k].target;
                var temparr = tar.split("/");
                for (var j = 1; j < temparr.length; j++) {
                    var temp = temparr[j].split(":");
                    var tempsup;
                    if (temp[1] == "RootElement") {
                        tempsup = "/" + temp[0] + ":root-instance";
                    } else {
                        tempsup = "/" + temp[0] + ":" + temp[2];
                    }
                    supplier += tempsup;
                    temp = new Abstraction(id, clientid, supplier, comment, currentFileName);
                    abstraction.push(temp);
                    supplier = "";
                }
            }
            else {
                var tempcom = comment.split("\r\r\n");
                for (var i = 1; i < tempcom.length; i++) {
                    var temparr = tempcom[i].split("/");
                    for (var j = 1; j < temparr.length; j++) {
                        var temp = temparr[j].split(":");
                        var tempsup;
                        if (temp[1] == "RootElement") {
                            tempsup = "/" + temp[0] + ":root-instance";
                        } else {
                            tempsup = "/" + temp[0] + ":" + temp[2];
                        }
                        supplier += tempsup;
                    }
                    //supplier.replace(/[\r\n]/g,'');
                    temp = new Abstraction(id, clientid, supplier, comment, currentFileName);
                    abstraction.push(temp);
                    supplier = "";
                }
            }
        }
    }
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

function classspec(abstraction){
    var client=[],clientid,clientname;
    var    supplier,supplierfilename,comment;
    for(var i = 0; i < abstraction.length; i++) {
        for (var j = 0; j < Class.length; j++) {
            if (abstraction[i].clientid == Class[j].id && abstraction[i].fileName == Class[j].fileName) {
                //client.push(Class[j]);
                clientid = abstraction[i].id;
                clientname = Class[j].name;
            }
            //supplierfilename = abstraction[i].supplierfilename;
            supplier = abstraction[i].supplier;
            currentFileName = abstraction[i].fileName;
            comment = abstraction[i].comment;
        }

        var newaug = new Augment(clientid, clientname, supplier, comment, currentFileName);
        augment.push(newaug);
        comment="";
    }
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
            if(openModelclass[j].id == ele[i].id){
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
            obj = new Node(ele[i].name, ele[i].description, "grouping", undefined, undefined, ele[i].id, undefined, undefined, ele[i].support, ele[i].status, ele[i].fileName);
        }else{
            obj = new Node(ele[i].name, ele[i].description, "grouping", ele[i]["max-elements"], ele[i]["max-elements"], ele[i].id, ele[i].config, ele[i].isOrdered, ele[i].support, ele[i].status, ele[i].fileName);
            obj.isAbstract = ele[i].isAbstract;
            obj.key = ele[i].key;
            obj.keyid = ele[i].keyid;
            obj.keyvalue=ele[i].keyvalue;
            // decide whether the "nodeType" of "ele" is grouping
            /*if(!ele[i].isAbstract) {
                for (var j = 0; j < Grouping.length; j++) {
                    if (ele[i].id == Grouping[j]) {
                        break;
                    }
                }
                if (j == Grouping.length && ele[i].type !== "DataType") {
                    //if the ele is grouping ,"obj.nodeType" is  "container"
                    obj.nodeType = "container";
                }
            }*/
        }
        /*if(ele[i].nodeType == "augment"){
            for(var j = 0; j < Class.length; j++){
                if(Class[i].type == Class[j].id){
                    obj.uses.push(Class[j].name);
                }
            }
        }*/

        //create the object of "typedef"
        if(ele[i].nodeType == "enumeration") {
            obj.nodeType = "typedef";
            if(ele[i].generalization.length > 0){
                for(var j = 0; j < ele[i].generalization.length; j++) {
                    for (var k = 0; k < Typedef.length; k++) {
                        if(ele[i].generalization[j] == Typedef[k].id){
                            ele[i].attribute[0].children = Typedef[k].attribute[0].children.concat(ele[i].attribute[0].children);
                            break;
                        }
                    }
                }
                ele[i].generalization = [];
            }
            for (var j = 0; j < ele[i].attribute.length; j++) {
                obj.buildChild(ele[i].attribute[j], "enumeration");
            }

        }
        //convert the "generalization" to "uses"
        if(ele[i].generalization.length !== 0) {
            for(var j = 0; j < ele[i].generalization.length; j++){
                for(var k = 0; k < Class.length; k++){
                    if(Class[k].id == ele[i].generalization[j]){
                        /*var Gname;
                        Class[k].Gname !== undefined ? Gname = Class[k].Gname : Gname = Class[k].name;*/
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
                    if(Typedef[k].id == ele[i].attribute[j].type){
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
                    if(openModelAtt[k].id == ele[i].attribute[j].id){
                        units = openModelAtt[k].units;
                        vr = openModelAtt[k].valueRange;
                        if(openModelAtt[k].condition !== undefined){
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
                        if(Class[k].id == name){
                            ele[i].attribute[j].isAbstract = Class[k].isAbstract;
                            if(Class[k].type !== "Class"){
                                ele[i].attribute[j].isleafRef = false;
                                ele[i].attribute[j].isGrouping = true;
                            }
                            //recursion
                            ele[i].attribute[j].key = Class[k].key;
                            ele[i].attribute[j].keyid = Class[k].keyid;
                            ele[i].attribute[j].keyvalue = Class[k].keyvalue;
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
                                    if(Class[k].instancePath[0] === "/"){
                                        ele[i].attribute[j].type = "leafref+path '" + Class[k].instancePath + "'";
                                    }else{
                                        ele[i].attribute[j].type = "leafref+path '/" + Class[k].instancePath + "'";
                                    }
                                    //add element "import" to module
                                    /*for (var t = 0; t < yangModule.length; t++) {
                                        if (ele[i].fileName === yangModule[t].fileName) {
                                            for (var f = 0; f < yangModule[t].import.length; f++) {
                                                if (yangModule[t].import[f] === Class[k].fileName.split('.')[0]) {
                                                    break;
                                                }
                                            }
                                            if (f === yangModule[t].import.length) {
                                                yangModule[t].import.push(Class[k].fileName.split('.')[0]);
                                                break;
                                            }
                                        }
                                    }*/
                                    //}
                                    /*if(Class[k].isAbstract){
                                        ele[i].attribute[j].type="string";
                                    }*/
                                    if(ele[i].attribute[j].nodeType === "list"){
                                        ele[i].attribute[j].nodeType = "leaf-list";
                                    }
                                    else if(ele[i].attribute[j].nodeType === "container"){
                                        ele[i].attribute[j].nodeType = "leaf";
                                    }
                                    break;
                                }
                                else{
                                    var Gname;
                                    Class[k].Gname !== undefined ? Gname = Class[k].Gname : Gname = Class[k].name;
                                    if (ele[i].fileName === Class[k].fileName) {
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
                    if(k === Class.length){
                        ele[i].attribute[j].nodeType === "list" ? ele[i].attribute[j].nodeType = "leaf-list" : ele[i].attribute[j].nodeType = "leaf";
                        ele[i].attribute[j].type = "string";
                    }
                }
                if(ele[i].attribute[j].type.split("+")[0] === "leafref"){
                    ele[i].attribute[j].type = new Type("leafref", ele[i].attribute[j].id, ele[i].attribute[j].type.split("+")[1], vr, "", "", ele[i].fileName);
                }else if(ele[i].attribute[j].nodeType === "leaf" || ele[i].attribute[j].nodeType === "leaf-list"){
                    ele[i].attribute[j].type = new Type(ele[i].attribute[j].type, ele[i].attribute[j].id, undefined, vr, "", "", ele[i].fileName);
                }/*else{
                 ele[i].attribute[j].type = new Type(ele[i].attribute[j].type, ele[i].attribute[j].id, undefined, vr, "", "", units, ele[i].fileName);
                }*/
                if(ele[i].attribute[j].type.range !== undefined){
                    var regex  = /[^0-9/./*]/;
                    if(regex.test(ele[i].attribute[j].type.range) === true){
                        if(ele[i].attribute[j].type.range.indexOf('*') !== -1){
                            ele[i].attribute[j].type.range = this.range.replace('*', "max");
                        }
                        ele[i].attribute[j].description += "\r\nrange of type : " + ele[i].attribute[j].type.range;
                        ele[i].attribute[j].type.range = undefined;
                        console.warn("Warning: The range of id = \"" + ele[i].attribute[j].type.id + "\"doesn't match the RFC 6020! We will put this range into description. Please recheck it.");
                    }else{
                        if(ele[i].attribute[j].type.range.indexOf('*') !== -1){
                            ele[i].attribute[j].type.range = this.range.replace('*', "max");
                        }
                    }
                }
               if(ele[i].attribute[j].isSpecTarget === false && ele[i].attribute[j].isSpecReference === false
                  && ele[i].attribute[j].isDefinedBySpec === false){
                    obj.buildChild(ele[i].attribute[j], ele[i].attribute[j].nodeType);//create the subnode to obj
                }/*else{
                    obj.children.push("");
                }*/
            }
        }
        //create the object of "typedef"
        if(ele[i].nodeType === "typedef"){
            obj.nodeType = "typedef";
            if(ele[i].attribute[0]){
                obj.buildChild(ele[i].attribute[0], "typedef");
            }else{
                obj.buildChild(ele[i], "typedef");
            }
        }
        //create "rpc"
        if(ele[i].nodeType === "rpc"){
            for (var j = 0; j < ele[i].attribute.length; j++) {
                var pValue = ele[i].attribute[j];
                for(var k = 0; k < Typedef.length; k++){
                    if(Typedef[k].id === pValue.type){
                        if(pValue.nodeType === "list"){
                            pValue.nodeType = "leaf-list";
                        }else{
                            pValue.nodeType = "leaf";
                        }
                        pValue.isUses = false;
                        if(Typedef[k].fileName === ele[i].fileName){
                            pValue.type = Typedef[k].name;
                        }else{
                            pValue.type = Typedef[k].fileName.split('.')[0] + ":" + Typedef[k].name;
                            //importMod(ele[i], Typedef[k]);
                        }
                        break;
                    }
                }
                for(var k = 0; k < openModelAtt.length; k++){
                    if(openModelAtt[k].id === ele[i].attribute[j].id){
                        //units = openModelAtt[k].units;
                        //vr = openModelAtt[k].valueRange;
                        pValue.units = openModelAtt[k].units;
                        pValue.valueRange = openModelAtt[k].valueRange;
                        if(openModelAtt[k].condition){
                            for(var m = 0; m < feat.length; m++){
                                if(feat[m].name === openModelAtt[k].condition && feat[m].fileName === openModelAtt[k].fileName){
                                    break;
                                }
                            }
                            if(m === feat.length){
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
                        if(Class[k].id === name){
                            pValue.isAbstract = Class[k].isAbstract;
                            if(Class[k].type !== "Class"){
                                pValue.isGrouping = true;
                            }
                            /*if(pValue.nodeType === "list"){
                                pValue.key = Class[k].key;
                                pValue.keyid = Class[k].keyid;
                            }*/
                            //recursion
                            if(i === k){
                                pValue.type = "leafref+path '/" + Class[k].instancePath.split(":")[1] + "'";
                                if(Class[k].isGrouping){
                                    pValue.type = "string";
                                }
                                if(pValue.nodeType === "list"){
                                    pValue.nodeType = "leaf-list";
                                }
                                else if(pValue.nodeType === "container"){
                                    pValue.nodeType = "leaf";
                                }
                                break;
                            }
                            /*else {
                                 if(pValue.isleafRef){
                                    var p = Class[k].instancePath.split(":")[0];
                                    if(ele[i].path === p){
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
                                    if(pValue.nodeType === "list"){
                                        pValue.nodeType = "leaf-list";
                                    }
                                    else if(pValue.nodeType === "container"){
                                        pValue.nodeType = "leaf";
                                    }
                                    break;
                                }*/
                            else {
                                var Gname;
                                Class[k].Gname !== undefined ? Gname = Class[k].Gname : Gname = Class[k].name;
                                if (ele[i].fileName === Class[k].fileName) {
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
                                        pValue.isUses = Class[k].fileName.split('.')[0] + ":" + Gname;
                                        //pValue.isUses = Class[k].name;
                                    }
                                    pValue.key = Class[k].key;
                                    pValue.keyid = Class[k].keyid;
                                    pValue.keyvalue = Class[k].keyvalue;
                                    break;
                                }
                            }
                        }
                        //}
                    }
                    if(k === Class.length){
                        pValue.nodeType === "list" ? ele[i].attribute[j].nodeType = "leaf-list" : pValue.nodeType = "leaf";
                        pValue.type = "string";
                    }
                }
                obj.buildChild(pValue, pValue.nodeType, pValue.rpcType);
            }
        }
        //decide whether a "container" is "list"
        if(obj.nodeType === "container") {
            for (var k = 0; k < association.length; k++) {
                if (ele[i].id === association[k].name) {
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
            /*if(ele[i].key.length !== 0){
                obj.nodeType = "list";
            }*/
            if(k === association.length){
                obj["ordered-by"] = undefined;
            }
            //obj.nodeType = "list";//
        }
        //add the "obj" to module by attribute "path"
        var newobj;
        var rootFlag=0;
        var flag = true;
        for(var n=0; n<rootElement.length; n++){
            if(ele[i].id==rootElement[n].id){
                rootFlag=1;
                flag=false;
                var des,max,min;
                if(rootElement[n].description){
                    des=rootElement[n].description;
                }
                /*else if(obj.description){
                    des=obj.description;
                }*/
                if(rootElement[n].multiplicity) {
                   min=rootElement[n].multiplicity.split("..")[0];
                   max=rootElement[n].multiplicity.split("..")[1];
                }
                newobj = new Node(ele[i].name, "", "container",max, min, obj.id, obj.config, obj["ordered-by"], undefined, undefined, ele[i].fileName);
                newobj.key = obj.key;
                newobj.keyid = obj.keyid;
                newobj.keyvalue = obj.keyvalue;
                newobj.uses.push(obj.name);
                newobj.presence=des;
                //var startnum=des.indexOf("Presence");
                //newobj.presence=des.substring(startnum);
                //decide whether a "container" is "list"
                if(max && (max>1 || max=="*" )){
                    newobj.nodeType = "list";
                    newobj.presence="";
                }
                if(newobj.nodeType !== "list"){
                    newobj["ordered-by"] = undefined;
                }
            break;

            }
        }

        /*if(ele[i].path === ""){
            for(var t = 0; t < yangModule.length; t++){
                if(ele[i].fileName === yangModule[t].fileName){
                        yangModule[t].children.push(newobj);
                    }
                    break;
                }
            }
        for(var t = 0; t < packages.length; t++) {
            if (packages[t].path === "") {
                tempPath = packages[t].name;
            } else {
                tempPath = packages[t].path + "-" + packages[t].name
            }
            if (tempPath === ele[i].path && packages[t].fileName === ele[i].fileName) {
                 packages[t].children.push(newobj)
                }
                break;
            }*/

        if(ele[i].nodeType === "notification"){
            //var a;
            newobj = new Node(ele[i].name, undefined, "notification", undefined, undefined, obj.id, obj.config, obj["ordered-by"], undefined, undefined, ele[i].fileName);
            newobj.uses.push(obj.name);
            
        } else if(ele[i].name === "Context") {
        //else if(ele[i].isAbstract === false && ele[i].nodeType === "grouping"){
            flag=false;
            newobj = new Node(ele[i].name, undefined, "container", undefined, undefined, obj.id, obj.config, obj["ordered-by"], undefined, undefined, ele[i].fileName);
            newobj.key = obj.key;
            newobj.keyid = obj.keyid;
            newobj.keyvalue = obj.keyvalue;
            newobj.uses.push(obj.name);
            if(obj.nodeType !== "grouping"){
                newobj.nodeType = obj.nodeType;
                obj.nodeType = "grouping";
            }
            //decide whether a "container" is "list"
            for (var k = 0; k < association.length; k++) {
                if (ele[i].id === association[k].name) {
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
        if(ele[i].path === ""){
            for(var t = 0; t < yangModule.length; t++){
                if(ele[i].fileName === yangModule[t].fileName){
                	if (ele[i].name === "Context" || ele[i].nodeType === "notification" ||rootFlag==1) {
                    //if ((ele[i].isAbstract === false && ele[i].nodeType === "grouping") || ele[i].nodeType === "notification") {
                        yangModule[t].children.push(newobj);
                    }
                    /*if (feat.length) {
                        yangModule[t].children = yangModule[t].children.concat(feat);
                    }*/
                    yangModule[t].children.push(obj);
                    rootFlag=0;
                    break;
                }
            }
        }

        for(var t = 0; t < packages.length; t++) {
            if (packages[t].path === "") {
                tempPath = packages[t].name;
            } else {
                tempPath = packages[t].path + "-" + packages[t].name
            }
            if (tempPath === ele[i].path && packages[t].fileName === ele[i].fileName) {
                //create a new node if "ele" needs to be instantiate
            	if (ele[i].name === "Context" || ele[i].nodeType === "notification" ||rootFlag==1) {
                //if ((ele[i].isAbstract === false && ele[i].nodeType === "grouping") || ele[i].nodeType === "notification") {
                    packages[t].children.push(newobj);
            	}
                /*if (feat.length) {

                    packages[t].children = packages[t].children.concat(feat);
                }*/
                packages[t].children.push(obj);
                rootFlag=0;
                break;
            }
        }
    }
    if(feat.length){
        for(var i = 0; i < feat.length; i++){
            if(feat[i].path === ""){
                for(var j = 0; j < yangModule.length; j++){
                    if(feat[i].fileName === yangModule[j].fileName){
                        yangModule[j].children.push(feat[i]);
                        break;
                    }
                }
            }else{
                for(var j = 0; j < packages.length; j++) {
                    if (packages[j].path === "") {
                        tempPath = packages[j].name;
                    }else {
                        tempPath = packages[j].path + "-" + packages[j].name;
                    }
                    if (tempPath === feat[i].path && packages[j].fileName === feat[i].fileName) {
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

function datatypeExe(id){
    for(var i = 0; i < Class.length; i++){
        if(Class[i].id = id){
            if(Class[i].attribute.length === 1 && Class[i].generalization.length === 0){
                if(Class[i].nodeType === "enumeration"){
                    return "enumeration," + i;
                }
                if(Class[i].attribute[0].isUses === false){
                    return "typedef," + Class[i].attribute[0].type;
                }else{
                    datatypeExe(Class[i].attribute[0].type);
                }
            }else{
                return "grouping";
            }
        }
    }
}

/*function importMod(ele,obj){
    for (var t = 0; t < yangModule.length; t++) {
        if (ele.path === yangModule[t].name) {
            for (var f = 0; f < yangModule[t].import.length; f++) {
                if (yangModule[t].import[f] === obj.path) {
                    break;
                }
            }
            if (f === yangModule[t].import.length) {
                yangModule[t].import.push(obj.path);
                break;
            }
        }
    }

}*/

function writeYang(obj) {
    var layer = 0;
    var st = obj.writeNode(layer);
    var res = st.replace(/\t/g, '    ');
    return res;
}

/*If you have any question, please contact with Email:venchibai@163.com*/