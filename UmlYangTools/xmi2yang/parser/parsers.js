var _            = require('lodash'),
    transformers = require('./transformers'),
    creators     = require('./creators');

var Util      = require('../model/yang/util');

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

var parsers = {
    parseOpenModelatt:function(xmi,store){
        var props = {
            flag:0,
            id:undefined,
            condition:undefined,
            support:undefined,
            valueRange:undefined,
            units:undefined,
            key:undefined,
            isInvariant:undefined,
            attributeValueChangeNotification:undefined,
            passBR:xmi.psBR
        };

        if(props.passBR){
            props.flag = 1;
        }

        var idAttributes = ["base_StructuralFeature","base_Parameter","base_Property"];
        _.forEach(idAttributes,function(attr){
            if(xmi.attributes()[attr]){
                props.id = xmi.attributes()[attr];
                return false;
            }
        });

        if(!props.id){
            return;
        }

        if(xmi.attributes()["condition"] && xmi.attributes()["condition"] != "none"){
            props.condition = xmi.attributes()["condition"].replace(/[ =]/g, '-').replace(/\./g, '').toLowerCase();
            if(xmi.attributes()["support"]){
                props.support = xmi.attributes()["support"];
            }
            props.flag = 1;
        }

        if(xmi.attributes()["valueRange"] && xmi.attributes()["valueRange"] !== "null" && xmi.attributes()["valueRange"] !== "NA" && xmi.attributes()["valueRange"] !== "See data type" && xmi.attributes()["valueRange"] !== "See data type."){
            props.valueRange = xmi.attributes()["valueRange"];
            props.flag = 1;
        }

        if(xmi.attributes()["unit"]){
            props.units = xmi.attributes()["unit"];
            props.flag = 1;
        }

        if(xmi.attributes()["partOfObjectKey"] && xmi.attributes()["partOfObjectKey"] != "0"){
            props.key = xmi.attributes()["partOfObjectKey"];
            props.flag = 1;
        }

        if(xmi.attributes()["isInvariant"]){
            props.isInvariant = xmi.attributes()["isInvariant"];
            props.flag = 1;
        }

        if(xmi.attributes()["attributeValueChangeNotification"]){
            props.attributeValueChangeNotification = xmi.attributes()["attributeValueChangeNotification"];
            props.flag = 1;
        }

        if(props.flag){
            transformers.transOpenModelAtt(store.openModelAtt, props, store);
        }
        return true;
    },
    parseOpenModelclass:function(xmi,store){
        var props = {
            flag:0,
            id:undefined,
            condition:undefined,
            support:undefined,
            operationExceptions:undefined,
            isOperationIdempotent:undefined,
            isAtomic:undefined,
            objectCreationNotification:undefined,
            objectDeletionNotification:undefined
        };

        if(xmi.attributes().base_Class) {
            props.id = xmi.attributes().base_Class;
        } else if(xmi.attributes().base_Operation) {
            props.id = xmi.attributes().base_Operation;
        } else {
            return;
        }

        if(xmi.attributes()["operation exceptions"]){
            props.operationExceptions = true;
            props.flag = 1;
        }
        if(xmi.attributes()["isOperationIdempotent"]){
            props.isOperationIdempotent = true;
            props.flag = 1;
        }
        if(xmi.attributes()["isAtomic"]){
            props.isAtomic = true;
            props.flag = 1;
        }

        if(xmi.attributes()["condition"] && xmi.attributes()["condition"] !== "none"){
            props.condition = xmi.attributes()["condition"].replace(/[ =]/g, '-').replace(/\./g, '').toLowerCase();;
            if(xmi.attributes()["support"]){
                props.support = xmi.attributes()["support"];
            }
            props.flag = 1;
        }
        if(xmi.attributes()["objectCreationNotification"]){
            props.objectCreationNotification = xmi.attributes()["objectCreationNotification"];
            props.flag = 1;
        }

        if(xmi.attributes()["objectDeletionNotification"]){
            props.objectDeletionNotification = xmi.attributes()["objectDeletionNotification"];
            props.flag = 1;
        }
        if(props.flag){
            transformers.transOpenModelClass(xmi,props, store);
        }
        return true;
    },
    parseOpenModelnotification:function(xmi,store){
        var id;
        if(xmi.attributes()["base_Signal"]){
            id = xmi.attributes()["base_Signal"];
        }
        store.openModelnotification.push(id);
    },
    parseSpecify:function(xmi,store){
        var props = {
            id:undefined,
            target:undefined
        };

        if(xmi.attributes()["base_Abstraction"]){
            props.id = xmi.attributes()["base_Abstraction"];
        }

        if(xmi.attributes()["target"]){
            props.target = xmi.attributes()["target"];
        }else if(xmi["target"]){
            props.target=xmi["target"].text();
        }
        var tempspec = new models.Specify(props.id,props.target,currentFilename);
        store.specify.push(tempspec);
    },
    parseComment:function(xmi,store){
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
    },
    parseRootElement:function(xmi,store){
        var props = {
            id:undefined,
            name:undefined,
            multiplicity:undefined,
            description:undefined
        };

        if(xmi.attributes()["base_Class"]){
            props.id = xmi.attributes()["base_Class"];
        }

        if(xmi.attributes()["name"]){
            props.name = xmi.attributes()["name"];
        }

        if(xmi.attributes()["multiplicity"]){
            props.multiplicity = xmi.attributes()["multiplicity"];
        }

        if(xmi.attributes()["description"]){
            props.description = xmi.attributes()["description"];
        }

        var tempRE = new models.RootElement(props.id,props.name,props.multiplicity,props.description,currentFilename);
        store.rootElement.push(tempRE);
    },
    parsePackage:function(xmi, filename,store){
        var props = {
            len:undefined,
            newxmi:undefined,
            mainmod:undefined,
            id:xmi.attributes()["xmi:id"],
            comment:''
        };

        if(xmi.attributes()["xmi:type"] == "uml:Package" || xmi.attributes()["xmi:type"] == "uml:Interface") {
            if(xmi.attributes().name) {
                props.mainmod = xmi.attributes().name
                props.mainmod = props.mainmod.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9\d]+$/g, "");   //remove the special character in the end
                props.mainmod = props.mainmod.replace(/[^\w\.-]+/g, '_');                     //not "A-Za-z0-9"->"_"
            } else {
                console.error("ERROR:The attribute 'name' of tag 'xmi:id=" + xmi.attributes()["xmi:id"] + "' in " + filename + " is empty!");
            }

            if (xmi.ownedComment) {
                props.comment = parsers.parseComment(xmi,store);
            }

            var temp = new yangModels.Package(props.mainmod, props.id, store.modName.join("-"), props.comment, currentFilename);
            store.packages.push(temp);
            store.modName.push(props.mainmod);

            if(xmi.packagedElement){
                xmi.packagedElement.array ? props.len = xmi.packagedElement.array.length : props.len = 1;
            }

            for(var i = 0; i < props.len; i++){
                props.len == 1 ? props.newxmi = xmi.packagedElement : props.newxmi = xmi.packagedElement.array[i];
                parsers.parsePackage(props.newxmi,undefined,store);
            }
            store.modName.pop();

            if(xmi.attributes()["xmi:type"] == "uml:Interface"){
                if(xmi.ownedOperation){
                    xmi.ownedOperation.array ? props.len = xmi.ownedOperation.array.length : props.len = 1;
                    for(var i = 0; i < props.len; i++){
                        props.len == 1 ? props.newxmi = xmi.ownedOperation : props.newxmi = xmi.ownedOperation.array[i];
                        creators.createClass(props.newxmi, "rpc",store);
                    }
                }
            }

        }else{
            creators     = require('./creators');
            creators.createElement(xmi,undefined,store);
        }

    },
    parseUmlModel:function(xmi, filename,store){
        var props = {
            mainmod:undefined,
            comment:"",
            namespace:"",
            prefix:"",
            pre:[],
            pre0:""
        };

        if(xmi.attributes().name){
            props.mainmod = xmi.attributes().name
        } else {
            console.error("ERROR:The attribute 'name' of tag 'xmi:id=" + xmi.attributes()["xmi:id"] + "' in " + filename + " is empty!");
        }

        props.mainmod = props.mainmod.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9\d]+$/g, "");   //remove the special character in the end
        props.mainmod = props.mainmod.replace(/[^\w\.-]+/g, '_');                              //not "A-Za-z0-9"->"_"

        store.modName.push(props.mainmod);
        if (xmi.ownedComment) {
            props.comment = parsers.parseComment(xmi,store);
        }


        props.namespace = config.namespace + store.modName.join("-");

        props.pre = store.modName.join("-");
        props.pre0 = Util.yangifyName(props.pre);

        if(props.prefix==""){
            props.prefix = Util.yangifyName(props.pre);
        }

        var yangModule = new yangModels.Module(store.modName.join("-"), props.namespace, "", props.prefix, config.organization, config.contact, config.revision, props.comment, currentFilename);
        store.modName.pop();

        var element = {
            newxmi:undefined,
            len:0,
            impLen:0,
            impObj:{},
            imp:undefined
        };

        if(xmi.packagedElement){
            xmi.packagedElement.array ? element.len = xmi.packagedElement.array.length : element.len = 1;
        }

        for(var i = 0; i < element.len; i++){
            element.len == 1 ? element.newxmi = xmi.packagedElement : element.newxmi = xmi.packagedElement.array[i];
            if(element.newxmi.attributes().name == "Imports"){
                element.newxmi.packageImport.array ? element.impLen = element.newxmi.packageImport.array.length : element.impLen = 1;
                for(var j = 0; j < element.impLen; j++){
                    element.impLen == 1 ? element.impObj = element.newxmi.packageImport : element.impObj = element.newxmi.packageImport.array[j];
                    element.imp = element.impObj.importedPackage.attributes().href.split('/').pop().split('.')[0];
                    yangModule.import.push(element.imp);
                }
            }
            parsers.parsePackage(element.newxmi,undefined,store);
        }
        store.yangModule.push(yangModule);
        store.modName.pop();
    },
    createLifecycle:function(xmi,str,store){
        return creators.createLifecycle(xmi,str,store);
    }
};

module.exports = {
    parseOpenModelatt:parsers.parseOpenModelatt,
    parseOpenModelclass:parsers.parseOpenModelclass,
    parseOpenModelnotification:parsers.parseOpenModelnotification,
    parseSpecify:parsers.parseSpecify,
    parseComment:parsers.parseComment,
    parseRootElement:parsers.parseRootElement,
    parsePackage:parsers.parsePackage,
    parseUmlModel:parsers.parseUmlModel,
    createLifecycle:parsers.createLifecycle,
    setConfig:setConfig,
    setCurrentFilename:setCurrentFilename
};