var _            = require('lodash'),
    transformers = require('./transformers'),
    parsers      = require('./parsers');

var models = {
    Clazz           : require('../model/ObjectClass.js'),
    OpenModelObject : require('../model/OpenModelObject.js'),
    Association     : require('../model/Association.js'),
    Specify         : require('../model/specify.js'),
    RootElement     : require('../model/RootElement.js')
};

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

var config = {}
function setConfig(cfg){
    config = cfg;
}

var currentFilename = "";
function setCurrentFilename(filename){
    currentFilename = filename;
}

var creators = {
    createClass:function(obj, nodeType,store){
        var props = {
            name:undefined,
            id : obj.attributes()["xmi:id"],
            type : obj.attributes()["xmi:type"].split(":")[1],
            config:true,
            isOrdered:false,
            path:undefined
        };

        if(obj.attributes().name) {
            props.name = obj.attributes().name
            props.name = props.name.replace(/^[^A-Za-z0-9|_]+|[^A-Za-z0-9|_\d]+$/g, "");
            props.name = props.name.replace(/[^\w\.-]+/g, '_');
        } else {
            console.error("ERROR:The attribute 'name' of tag 'xmi:id=" + obj.attributes()["xmi:id"] + "' in this file is empty!");
        }

        if(obj.attributes().isReadOnly){ props.config = false; }
        if(obj.attributes().isOrdered){ props.isOrdered = obj.attributes().isOrdered }

        props.path = store.modName.join("-");
        if (obj.ownedComment) {
            props.comment = parsers.parseComment(obj,store);
        }

        var node = new models.Clazz(props.name, props.id, props.type, props.comment, nodeType, props.path, props.config, props.isOrdered, currentFilename);
        transformers.transClazz(store.openModelnotification,obj,node,props, nodeType,store);
        store.Class.push(node);
        return true;
    },
    createElement:function (xmi,param,store) {
        if(typeof xmi == "object"){
            var props = {
                ele : xmi,
                len : undefined,
                obj : undefined
            };

            xmi.array ? props.len = xmi.array.length : props.len = 1;

            var cases = [
                {type:"uml:Enumeration",action:"createClass",param:"enumeration"},
                {type:"uml:DataType",action:"createClass",param:"dataType"},
                {type:"uml:PrimitiveType",action:"createClass",param:"typedef"},
                {type:"uml:Class",action:"createClass",param:"grouping"},
                {type:"uml:Operation",action:"createClass",param:"rpc"},
                {type:"uml:Package",action:"createClass",param:"grouping"},
                {type:"uml:Association",action:"createAssociation"},
                {type:"uml:Signal",action:"createClass",param:"notification"},
                {type:"uml:Abstraction",action:"createAbstraction"},
            ];

            for (var i = 0; i < props.len; i++) {
                props.len == 1 ? props.obj = props.ele : props.obj = props.ele.array[i];

                var caseKey = _.find(cases,{type:props.obj.attributes()["xmi:type"]});
                if(caseKey){
                    creators[caseKey.action](props.obj,caseKey.param, store);
                }
            }
        }
    },
    createAssociation:function(obj, param, store) {
        var props = {
            ele:undefined,
            len:undefined,
            assoid:obj.attributes()["xmi:id"],
            strictCom:false,
            extendedCom:false,
            comflag:false,
            name:undefined,
            id:undefined,
            type:undefined,
            upperValue:undefined
        };

        for(var i=0; i < store.strictComposite.length; i++){
            if(store.strictComposite[i] == props.assoid){
                props.strictCom = true;
                props.comflag = true;
                break;
            }
        }

        for(var j=0; j < store.extendedComposite.length; j++){
            if(store.extendedComposite[j] == props.assoid){
                props.extendedCom=true;
                props.comflag=true;
                break;
            }
        }

        if (obj.ownedEnd) {
            obj.ownedEnd.array ? props.len = obj.ownedEnd.array.length : props.len = 1;
            for (var i = 0; i < props.len; i++) {
                obj.ownedEnd.array ? props.ele = obj.ownedEnd.array[i] : props.ele = obj.ownedEnd;
                var forProps = {
                    name: props.ele.attributes().type,
                    id: props.ele.attributes()['xmi:id'],
                    type: undefined,
                    upperValue: undefined,
                    lowerValue: undefined
                };
                props.ele.upperValue ? forProps.upperValue = props.ele.upperValue.attributes().value : forProps.upperValue = "";
                props.ele.lowerValue ? forProps.lowerValue = props.ele.lowerValue.attributes().value : forProps.lowerValue = "";
                    for(var j = 0; j < store.association.length; j++){
                        //if(forProps.name == store.association[j].name){
                        if(forProps.id == store.association[j].id){
                            break;
                        }
                    }

                    if(j == store.association.length){
                        forProps.type = "list";
                        //var a = new models.Association(forProps.name, forProps.id, forProps.type, forProps.upperValue, forProps.lowerValue);
                        var a = new models.Association(forProps.name, forProps.id, forProps.type, forProps.upperValue, forProps.lowerValue, props.assoid, props.strictCom, props.extendedCom);
                        store.association.push(a);
                    }
            }
        }
    },
    createAbstraction:function(obj,param,store) {
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
            comment = parsers.parseComment(obj,store);
        }

        for (var k = 0; k < store.specify.length; k++) {
            if (store.specify[k].id == id && store.specify[k].fileName == currentFilename ) {
                if (store.specify[k].target && store.specify[k].target.length > 0) {
                    var tar = store.specify[k].target;
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
                    }
                    temp = new yangModels.Abstraction(id, clientid, supplier, comment, currentFilename);
                    store.abstraction.push(temp);
                    supplier = "";
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
                        temp = new yangModels.Abstraction(id, clientid, supplier, comment, currentFileName);
                        store.abstraction.push(temp);
                        supplier = "";
                    }
                }
            }
        }
    },
    createLifecycle:function(xmi, str,store){
        var props = {
            id:undefined,
            nodetype:undefined
        };

        if(xmi.attributes().base_Parameter){
            props.id = xmi.attributes().base_Parameter;
            props.nodetype = "attribute";
        }else if(xmi.attributes().base_StructuralFeature){
            props.id = xmi.attributes().base_StructuralFeature;
            props.nodetype = "attribute";
        }else if(xmi.attributes().base_Operation){
            props.id = xmi.attributes().base_Operation;
            props.nodetype = "class";
        }else if(xmi.attributes().base_Class){
            props.id = xmi.attributes().base_Class;
            props.nodetype = "class";
        }else if(xmi.attributes().base_DataType){
            props.id = xmi.attributes().base_DataType;
            props.nodetype = "class";
        }else if(xmi.attributes().base_Element){
            props.id = xmi.attributes().base_Element;
            props.nodetype = "attribute";   //attribute or class
        }else{
            return;
        }

        function processArrays(array,props,modelProp){
            for(var i = 0; i < array.length; i++){
                if(array[i].id == props.id){
                    if(array[i].status !== undefined) {
                        array[i].status = str;
                    } else {
                        array[i].status = null;
                    }
                    break;
                }
            }
            if(i == array.length){
                var att;
                if(modelProp) {
                    att = new models.OpenModelObject(props[modelProp]);
                } else {
                    att = new models.OpenModelObject();
                }
                att.status = str;
                att.fileName = currentFilename;
                array.push(att);
            }

        }

        switch(props.nodetype){
            case "class":
                processArrays(store.openModelclass,props,"id");
                break;
            case "attribute":
                processArrays(store.openModelAtt,props);
                break;
        }
    },
    createFeature:function(obj,path,store){
        var feat = new yangModels.Feature(obj.id, obj.condition, path, "",obj.fileName);
        return feat;
    }
};

module.exports = {
    createClass:creators.createClass,
    createElement:creators.createElement,
    createAssociation:creators.createAssociation,
    createAbstraction:creators.createAbstraction,
    createLifecycle:creators.createLifecycle,
    createFeature:creators.createFeature,
    setConfig:setConfig,
    setCurrentFilename:setCurrentFilename
};