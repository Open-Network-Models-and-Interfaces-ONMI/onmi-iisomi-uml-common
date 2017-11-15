var processors   = require('./processors');

var models = {
    Clazz           : require('../model/ObjectClass.js'),
    OpenModelObject : require('../model/OpenModelObject.js'),
    Association     : require('../model/Association.js'),
    Specify         : require('../model/specify.js'),
    RootElement     : require('../model/RootElement.js')
};

var config = {};
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

var transformers = {
    transOpenModelAtt:function(openModelAttArray,props,store){
        for(var i = 0; i < openModelAttArray.length; i++){
            if(openModelAttArray[i].id == props.id){
                _.forOwn(props,function(val,key){
                    if(val !== undefined){
                        openModelAttArray[i][key] = val;
                    } else {
                        openModelAttArray[i][key] = null;
                    }
                });
            }
        }
        if(i == openModelAttArray.length){
            var att = new models.OpenModelObject(props.id, "attribute", props.valueRange, props.condition, props.support, props.isInvariant, props.attributeValueChangeNotification, undefined, undefined, props.passBR, undefined, undefined, undefined, props.key, props.units, currentFilename);
            openModelAttArray.push(att);
        }
    },
    transOpenModelClass:function(openModelclass,props,store){
        var keys = ["support","condition","objectCreationNotification", "objectDeletionNotification"];
        for(var i = 0; i < openModelclass.length; i++){
            if(openModelclass[i].id == props.id){
                _.forOwn(props,function(val,key){
                    if(keys.indexOf(key) !== -1) {
                        if (val !== undefined) {
                            openModelclass[i][key] = val;
                        } else {
                            openModelclass[i][key] = null
                        }
                    }
                });
            }
        }
        if(i == openModelclass.length){
            var att = new models.OpenModelObject(props.id, "class", undefined, props.condition, props.support, undefined, undefined, props.objectDeletionNotification, props.objectCreationNotification, undefined, undefined, undefined, undefined, undefined, undefined, currentFilename);
            openModelclass.push(att);
        }
    },
    transClazz:function(openModelnotification,obj,node,global,nodeType,store){
        var props = {};

        if(node.nodeType == "notification"){
            completeLoopAction(store.openModelnotification, node.id, function(){
                node.nodeType == "grouping";
                node.isAbstract == true;
            });
        }

        if (obj.attributes().isAbstract == "true") {
            node.isAbstract = true;
        }

        if (obj.attributes().isLeaf == "true") {
            node.isLeaf = true;
        }

        if (obj['generalization']) {
            processors.clazz.generalization(props,obj,node,store);
        }

        if (obj['ownedAttribute']) {
            processors.clazz.ownedAttribute(props,obj,node,store);
        }

        if (node.isEnum()) {
            processors.clazz.node.enum(props,obj,node,global,store);
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
            store.Typedef.push(node);
        }

        if (obj['ownedParameter']) {
            processors.clazz.ownedParameter(props,obj,node,store);
        }
    }
};

module.exports = {
    transOpenModelAtt:transformers.transOpenModelAtt,
    transOpenModelClass:transformers.transOpenModelClass,
    transClazz:transformers.transClazz,
    setConfig:setConfig,
    setCurrentFilename:setCurrentFilename
};