var _            = require('lodash');

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
    Augment     : require('../model/yang/augment.js'),
    Util         :require('../model/yang/util.js')
};

var config = {}
function setConfig(cfg){
    config = cfg;
}

var currentFilename = "";
function setCurrentFilename(filename){
    currentFilename = filename;
}

function completeLoopAction(array, value, action, arrayProp){
    for (var j = 0; j < array.length; j++) {
        if(arrayProp){
            if (array[j][arrayProp] == value) {
                break;
            }
        } else {
            if (array[j] == value) {
                break;
            }
        }
    }
    if (j == array.length) {
        action();
    }
}

var processors = {
    clazz:{
        basicTypes:function(props,obj,node,i,store){
            //add props.r to "Grouping" array
            completeLoopAction(store.Grouping, props.r, function(){
                store.Grouping.push(props.r);
            });

            //if the nodeType of element referencing r is "list",new an object "association"
            if(node.attribute[i].nodeType == "list"){
                completeLoopAction(store.association, props.r, function(){
                    var a = new models.Association(props.r, node.attribute[i].id, "list", node.attribute[i].upperValue, node.attribute[i].lowerValue);
                    store.association.push(a);
                },"name");
            }

            //add "path"
            for(var k = 0; k < store.openModelAtt.length; k++){
                if(store.openModelAtt[k].id == node.attribute[i].id){
                    if(store.openModelAtt[k].passedByReference){
                        node.attribute[i].isleafRef = true;
                        break;
                    }
                    else if(store.openModelAtt[k].passedByReference == false){
                        node.attribute[i].isleafRef = false;
                        break;
                    }
                    if(store.openModelAtt[k].key){
                        if(props.att.attributes().name){
                            var tempName = props.att.attributes().name;
                            tempName = tempName.replace(/^[^A-Za-z|_]+|[^A-Za-z|_\d]+$/g, "");
                            tempName = tempName.replace(/[^\w\.-]+/g, '_');
                            node.key.push(tempName);
                            node.keyid.push(props.att.attributes()["xmi:id"]);
                            node.keyvalue.push(store.openModelAtt[k].key);
                        }
                    }
                }
            }
        },
        nodeUpdate:function(props,obj,node,i,store){
            for(var k = 0; k < store.openModelAtt.length; k++){
                if(store.openModelAtt[k].id == node.attribute[i].id){
                    if(store.openModelAtt[k].key){
                        if(props.att.attributes().name){
                            var tempName = props.att.attributes().name;
                            tempName = tempName.replace(/^[^A-Za-z|_]+|[^A-Za-z|_\d]+$/g, "");
                            tempName = tempName.replace(/[^\w\.-]+/g, '_');
                            node.key.push(tempName);
                            node.keyid.push(props.att.attributes()["xmi:id"]);
                            node.keyvalue.push(store.openModelAtt[k].key);
                        }
                    }
                }
            }
        },
        generalization:function(props,obj,node,store){
            props = _.assign(props,{
                len:0,
                gen:undefined
            });

            obj['generalization'].array ? props.len = obj['generalization'].array.length : props.len = 1;
            for (var i = 0; i < props.len; i++) {
                props.len == 1 ? props.gen = obj['generalization'] : props.gen = obj['generalization'].array[i];
                node.buildGeneral(props.gen);
                completeLoopAction(store.Grouping, node.generalization[i], function(){
                    store.Grouping.push(node.generalization[i]);
                });
            }
        },
        ownedAttribute:function(props,obj,node,store){
            props = _.assign(props,{
                len:0,
                att:undefined,
                id:undefined,
                r:undefined
            });

            obj['ownedAttribute'].array ? props.len = obj['ownedAttribute'].array.length : props.len = 1;
            for (var i = 0; i < props.len; i++) {
                props.len == 1 ? props.att = obj['ownedAttribute'] : props.att = obj['ownedAttribute'].array[i];
                props.id = props.att.attributes()["xmi:id"];
                props.r = node.buildAttribute(props.att);

                if (props.r !== "basicType") {
                    processors.clazz.basicTypes(props,obj,node, i, store);

                    if(!node.attribute[i].isleafRef && node.type == "Class"){
                        var instance = {};
                        instance.id = props.r;
                        instance.pnode = node.id;
                        instance.fileName = node.fileName;
                        instance.path = node.fileName.split('.')[0] + ":" + node.name + "/" + node.attribute[i].fileName.split('.')[0] + ":" +node.attribute[i].name;
                        if(props.r == node.id){
                            instance.tpath = instance.path;
                            console.warn("Warning:xmi:id=" + props.r + " can not be compositeed by itself!");
                        }
                        store.isInstantiated.push(instance);
                    }
                } else {
                    processors.clazz.nodeUpdate(props,obj,node,i,store);
                }
            }
        },
        ownedParameter:function(props,obj,node,store){
            props = _.assign(props,{
                len:0,
                para:undefined,
                r:undefined
            });

            obj['ownedParameter'].array ? props.len = obj['ownedParameter'].array.length : props.len = 1;
            for (var i = 0; i < props.len; i++) {
                props.len == 1 ? props.para = obj['ownedParameter'] : props.para = obj['ownedParameter'].array[i];
                props.r = node.buildOperate(props.para);

                if (props.r !== "basicType") {
                    processors.clazz.basicTypes(props,obj,node,i,store);
                }

                processors.clazz.nodeUpdate(props,obj,node,i,store);
            }
        },
        node:{
            enum:function(props,obj,node,global,store){
                if(node.isLeaf == true){
                    node.buildEnum(obj);
                    store.Typedef.push(node);
                } else{
                    node.buildIdentityref(obj);
                    store.Typedef.push(node);

                    global.name=global.name.replace(/-t$/g,"");
                    global.name=yangModels.Util.typeifyName(global.name);
                    global.name=global.name.replace(/-/g,"_");
                    global.name=global.name.toUpperCase();
                    var nodeI = new yangModels.Node(global.name,"","identity");
                    nodeI.fileName=node.fileName;
                    store.Identity.push(nodeI);
                    var vals = {
                        enumComment:undefined,
                        enumValue:undefined,
                        enumNode:undefined,
                        literal:obj["ownedLiteral"]
                    };

                    if(!vals.literal){
                        return;
                    }

                    if (vals.literal.array) {
                        for (var i = 0; i < vals.literal.array.length; i++) {
                            vals.enumValue = vals.literal.array[i].attributes().name;
                            vals.enumComment = "";
                            if(vals.literal.array[i]["ownedComment"]){
                                if (vals.literal.array[i]["ownedComment"].array) {
                                    vals.enumComment = vals.literal.array[i]["ownedComment"].array[0].body.text();
                                    for (var j = 1; j < vals.literal.array[i]["ownedComment"].array.length; j++) {
                                        vals.enumComment += "\r\n" + vals.literal.array[i]["ownedComment"].array[j].body.text();
                                    }
                                } else {
                                    vals.enumComment = vals.literal.array[i]["ownedComment"].body.text();
                                }
                            }
                            vals.enumValue=global.name+"_"+vals.enumValue;
                            vals.enumValue = vals.enumValue.replace(/[^\w\.-]+/g, '_');
                            vals.enumNode = new yangModels.Node(vals.enumValue, vals.enumComment, "identity");

                            var baseNode = new yangModels.Node(global.name, "", "base");
                            vals.enumNode.fileName = node.fileName;
                            vals.enumNode.children.push(baseNode);
                            store.Identity.push(vals.enumNode);
                        }
                    } else {
                        vals.enumValue = vals.literal.attributes().name;
                        if(vals.literal["ownedComment"]){
                            vals.enumComment = "";
                            if (vals.literal["ownedComment"].array) {
                                for (var j = 0; j < vals.literal["ownedComment"].array.length; j++) {
                                    if(vals.literal["ownedComment"].array[j].hasOwnProperty("body") && vals.literal["ownedComment"].array[j].body.hasOwnProperty("text")){
                                        vals.enumComment += vals.literal["ownedComment"].array[j].body.text() + "\r\n";
                                    }
                                }
                                vals.enumComment = vals.enumComment.replace(/\r\n$/g, "");
                            } else if(vals.literal["ownedComment"].hasOwnProperty("body") && vals.literal["ownedComment"].body.hasOwnProperty("text")){
                                vals.enumComment = vals.literal["ownedComment"].body.text();
                            }else{
                                console.log("[Processor] The comment of xmi:id=\"" + vals.literal.attributes()["xmi:id"] + "\" is undefined!");
                            }
                        }
                        vals.enumValue=global.name+"_"+vals.enumValue;
                        vals.enumValue = vals.enumValue.replace(/[^\w\.-]+/g,'_');
                        vals.enumNode = new yangModels.Node(vals.enumValue, vals.enumComment, "identity");
                        var baseNode=new yangModels.Node(global.name, "", "base");
                        vals.enumNode.fileName = node.fileName;
                        vals.enumNode.children.push(baseNode);
                        store.Identity.push(vals.enumNode);
                    }
                }
            }
        }
    }
};

module.exports = {
    clazz:processors.clazz,
    setConfig:setConfig,
    setCurrentFilename:setCurrentFilename
};