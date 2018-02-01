var yangProcessors = require("./yangprocessors");
var yangModels = {
    Module      : require('../model/yang/module.js'),
    Package     : require('../model/yang/package.js'),
    Node        : require('../model/yang/node.js'),
    Abstraction : require('../model/yang/abstraction.js'),
    Feature     : require('../model/yang/feature.js'),
    RPC         : require('../model/yang/rpc.js'),
    Uses        : require('../model/yang/uses.js'),
    Type        : require('../model/yang/type.js'),
    Augment     : require('../model/yang/augment.js')
};

var builders = {
    buildGeneralization:function(Class,store){
        for(var i = 0; i < Class.length; i++){
            var classItem = Class[i];
            for(var j = 0; j < classItem.generalization.length; j++){
                for(var k = 0; k < Class.length; k++){
                    var classItem2 = Class[k];
                    if(classItem.generalization[j] === classItem2.id){
                        for(var m = 0; m < store.generalization.length; m++){
                            var item = store.generalization[m];
                            if(item.class1.id === classItem.id && item.class2.id === classItem2.id && item.class1.fileName === classItem.fileName && item.class2.fileName === classItem2.fileName){
                                break;
                            }
                        }
                        if(m === store.generalization.length){
                            store.generalization.push({
                                class1 : classItem,
                                class2 : classItem2
                            });
                            break;
                        }
                    }
                }
            }
        }
    },
    inheritKey:function(general, store) {
        var props = {
            keyLength:undefined,
            newnode:undefined,
            newkey:undefined,
            newkeyid:undefined,
            newkeyvalue:undefined
        };

        if(general.class2.key.length !== 0){
            props.keyLength = general.class2.key instanceof Array ? general.class2.key.length : 1;
            for(var i = 0; i < props.keyLength; i++){
                props.newkey = props.keyLength === 1 ? general.class2.key : general.class2.key[i];
                props.newkeyid = props.keyLength === 1 ? general.class2.keyid : general.class2.keyid[i];
                props.newkeyvalue = props.keyLength === 1 ? general.class2.keyvalue : general.class2.keyvalue[i];
                if(general.class2.key instanceof Array){
                    props.newkey = general.class2.key[0];
                    props.newkeyid = general.class2.keyid[0];
                    props.newkeyvalue = general.class2.keyvalue[0];
                }
                for(var j = 0; j < general.class1.key.length; j++){
                    if(props.newkeyid === general.class1.keyid[j]){
                        break;
                    }
                }
                if(j === general.class1.key.length){
                    general.class1.key.push(props.newkey);
                    general.class1.keyid.push(props.newkeyid);
                    general.class1.keyvalue.push(props.newkeyvalue);
                    builders.inherit(general.class1, props.newkey, props.newkeyid, props.newkeyvalue, store);
                }

            }
        }
    },
    inherit:function(Class, key, keyid, keyvalue, store){
        for(var i = 0; i < store.generalization.length; i++){
            var item = store.generalization[i];
            if(item.class2.id === Class.id && item.class2.fileName === Class.fileName){
                for(var j = 0; j < item.class1.key.length; j++){
                    if(keyid === item.class1.keyid[j]){
                        break;
                    }
                }
                if(j === item.class1.key.length){
                    item.class1.key.push(key);
                    item.class1.keyid.push(keyid);
                    item.class1.keyvalue.push(keyvalue);

                    builders.inherit(item.class1, key, keyid, keyvalue, store);
                }
            }
        }
    },
    addPath:function(id, Class, pflag, store){
        var path,
            temp;

        for(var i = 0; i < store.isInstantiated.length; i++){
            var item = store.isInstantiated[i];
            if(id === item.id){
                if(item.tpath){
                    path = item.tpath;
                } else {

                    if (item.pnode === pflag) {
                        console.warn("Warning:xmi:id=" + pflag + " and xmi:id=" + item.id + " have been found cross composite!");
                        return path;
                    }

                    path = item.path;

                    temp = builders.addPath(item.pnode, Class, pflag, store);
                    if (temp) {
                        path = path.split("/")[1];
                        path = temp + '/' + path;
                    } else {
                        item.tpath = path;
                    }
                }

                if(path){
                    Class.instancePathFlag = false;
                }
                return path;
            }
        }
    },
    datatypeExe:function(id, store){
        for(var i = 0; i < store.Class.length; i++){
            var item = store.Class[i];
            if(item.id = id){
                if(item.attribute.length === 1 && item.generalization.length === 0){
                    if(item.nodeType === "enumeration"){
                        return "enumeration," + i;
                    }
                    if(item.attribute[0].isUses === false){
                        return "typedef," + item.attribute[0].type;
                    }else{
                        builders.datatypeExe(item.attribute[0].type);
                    }
                }else{
                    return "grouping";
                }
            }
        }
    },
    classspec:function(abstraction, withSuffix, store){
        var clientid,clientname;
        var supplier,comment;

        for(var i = 0; i < abstraction.length; i++) {
            for (var j = 0; j < store.Class.length; j++) {
                var clazz = store.Class[j];
                if (abstraction[i].clientid == clazz.id && abstraction[i].fileName == clazz.fileName) {
                    clientid = abstraction[i].id;
                    clientname = clazz.name;
                }
                supplier = abstraction[i].supplier;
                currentFilename = abstraction[i].fileName;
                comment = abstraction[i].comment;
            }

            if(withSuffix && clientname.match(/-g$/g)==null){
                clientname+='-g';
            }

            var newaug = new yangModels.Augment(clientid, clientname, supplier, comment, currentFilename);
            store.augment.push(newaug);
            comment="";
        }

    },
    obj2yang:function(ele,store,config){
        yangProcessors.pushPackages(store);
        yangProcessors.mapPackages(store);
        var feat = yangProcessors.processFeat(ele,store,config);
        if(feat.length){
            var tempPath;
            for(var i = 0; i < feat.length; i++){
                if(feat[i].path === ""){
                    for(var j = 0; j < yangModule.length; j++){
                        if(feat[i].fileName === yangModule[j].fileName){
                            yangModule[j].children.push(feat[i]);
                            break;
                        }
                    }
                }else{
                    var packages = store.packages;
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
        console.log("[Builders] xmi translate to yang successfully!")
    },
    crossRefer:function(mod,store){
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
    },
    steps:{
        processPath:function(clazz,store){
            var path = builders.addPath(clazz.id, clazz, clazz.id, store);

            if(!path){
                if(clazz.key.array){
                    clazz.instancePath = clazz.fileName.split('.')[0] + ":" + clazz.name + "/" + clazz.fileName.split('.')[0] + ":" + clazz.key.join(" ");
                }else{
                    if(clazz.key !== ""){
                        clazz.instancePath = clazz.fileName.split('.')[0] + ":" + clazz.name + "/" + clazz.fileName.split('.')[0] + ":" + clazz.key;
                    }else{
                        clazz.instancePath = clazz.fileName.split('.')[0] + ":" + clazz.name + "/";
                    }
                }
            }else{
                clazz.isGrouping = true;
                var fileName;
                if(clazz.instancePathFlag === true){
                    fileName = clazz.fileName.split(".")[0];
                }else{
                    fileName = path.split("/")[path.split("/").length - 1].split(":")[0];
                }
                if(clazz.key.array) {
                    clazz.instancePath = path + "/" + fileName + ":" + clazz.key.join(" ");
                }else{
                    if(clazz.key !== "") {
                        clazz.instancePath = path + "/" + fileName + ":" + clazz.key;
                    }else{
                        clazz.instancePath = path + "/";
                    }
                }
            }

        },
        processGrouping:function(Class, store){
            for(var i = 0; i < Class.length; i++) {
                var clazz = Class[i];
                if (clazz.type === "DataType" && clazz.nodeType === "grouping" && clazz.generalization.length === 0) {
                    if (clazz.attribute.length === 1) {
                        if (!clazz.attribute[0].isUses) {
                            clazz.nodeType = "typedef";
                            clazz.type = clazz.attribute[0].type;
                            clazz.attribute = [];
                            store.Typedef.push(clazz);
                        } else {
                            if (!(clazz.attribute[0].nodeType === "list" || clazz.attribute[0].nodeType === "container")) {
                                var t = builders.datatypeExe(clazz.attribute[0].type);
                                switch (t.split(",")[0]) {
                                    case "enumeration":
                                        clazz.attribute = Class[t.split(",")[1]].attribute;
                                        var a = Class[t.split(",")[1]].generalization;
                                        if (a.length > 0) {
                                            for (var j = 0; j < a.length; j++) {
                                                for (var k = 0; k < Class.length; k++) {
                                                    if (a[j] === Class[k].id) {
                                                        clazz.attribute = clazz.attribute.concat(Class[k].attribute);
                                                    }
                                                }
                                            }
                                        }
                                        store.Typedef.push(clazz);
                                        break;
                                    case "typedef":
                                        clazz.type = t.split(",")[1];
                                        clazz.attribute = [];
                                        store.Typedef.push(clazz);
                                        break;
                                    default:
                                        break;
                                }
                                clazz.nodeType = t.split(",")[0];
                            }
                        }
                    }
                }
                for (var j = 0; j < store.openModelclass.length; j++) {
                    var omc = store.openModelclass[j];
                    if (omc.id === clazz.id) {
                        if (omc.condition) {
                            clazz.support = omc.support;
                        }
                        if (omc.status) {
                            clazz.status = omc.status;
                        }
                        break;
                    }
                }
            }
        }
    }
};

module.exports = {
  buildGeneralization:builders.buildGeneralization,
  inheritKey:builders.inheritKey,
  inherit:builders.inherit,
  addPath:builders.addPath,
  datatypeExe:builders.datatypeExe,
  classspec:builders.classspec,
  obj2yang:builders.obj2yang,
  crossRefer:builders.crossRefer,
  steps:builders.steps
};
