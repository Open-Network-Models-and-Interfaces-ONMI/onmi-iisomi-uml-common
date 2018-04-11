var fs        = require('fs'),
    xmlreader = require('xmlreader'),
    _         = require('lodash');

var config = {}, configs = {};
var currentFilename = "";

var store = {
    openModelAtt:[],
    openModelclass:[],
    openModelnotification:[],
    modName:[],
    yangModule:[],
    packages:[],
    association:[],
    abstraction:[],
    Class:[],
    Grouping:[],
    Typedef:[],
    isInstantiated:[],
    Identity:[],
    specify:[],
    strictComposite:[],
    extendedComposite:[],
    rootElement:[],
    generalization:[],
    augment:[]
};

var yangProcessors = require("../generator/yangprocessors"),
    builders       = require("../generator/builders");

var processors   = require('./processors'),
    transformers = require('./transformers'),
    parsers      = require('./parsers'),
    creators     = require('./creators');


function setConfig(cfg){
    config = cfg;
    processors.setConfig(config);
    transformers.setConfig(config);
    creators.setConfig(config);
    parsers.setConfig(config);
}

function setConfigs(cfgs){
    configs = cfgs;
}

function matchConfigs(filename){
    var cfg = {};
    var fallbackKey = "";

    _.forOwn(configs,function(value,key){
        if(filename.toLowerCase().indexOf(key.toLowerCase()) === 0){
             console.log("[Config] " + filename + " Using Config: ",key);
             cfg = value;
        }
        if(_.isEmpty(fallbackKey)){
            fallbackKey = key;
        }
    });

    if(_.isEmpty(cfg)){
        console.log("[Config] " + filename + " No Config Match, Using Config: ",fallbackKey);
        setConfig(configs[fallbackKey]);
    } else {
        setConfig(cfg);
    }
}

function setCurrentFilename(filename){
    currentFilename = filename;
    processors.setCurrentFilename(currentFilename);
    transformers.setCurrentFilename(currentFilename);
    creators.setCurrentFilename(currentFilename);
    parsers.setCurrentFilename(currentFilename);
}

function parseFiles(files){
    _.forEach(files, function (file) {
        setCurrentFilename(file);
        parseModule(file);
    });
}

function parseModule(file){
    var xml = fs.readFileSync(configs.projectDir + "/" + file, {encoding: 'utf8'});
    matchConfigs(file);
    xmlreader.read(xml,function(error, model) {
        if (error) {
            console.error('There was a problem reading data from ' + file + '. Please check your xmlreader module and nodejs!\t\n');
            console.error(error.stack);
        } else {
            console.log("[Parse] " + configs.projectDir + "/" + file + " read successfully!");
            var xmi = model["xmi:XMI"];//xmi:the content of xmi:XMI object in model
            var flag = 0;
            var newxmi;
            if(xmi){                   //model stores what XMLREADER read
                var obj;
                for(var key in xmi){                            //key:the child node of xmi
                    switch(key.split(":")[1]){
                        case "OpenModelAttribute":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];      //newxmi: the array in OpenModel_Profile:OpenModelAttribute
                            var len = xmi[key].array ? xmi[key].array.length : 1;     //OpenModel_Profile:the number of array object in OpenModelAttribute
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.parseOpenModelatt(obj,store);
                            }
                            break;
                        case "OpenModelClass":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.parseOpenModelclass(obj,store);
                            }
                            break;
                        case "OpenModelNotification":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.parseOpenModelnotification(obj,store);
                            }
                            break;
                        case "OpenModelParameter":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.parseOpenModelatt(obj,store);
                            }
                            break;
                        case "Preliminary":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.createLifecycle(obj, "Preliminary",store);
                            }
                            break;
                        case "Mature":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.createLifecycle(obj, "current",store);
                            }
                            break;
                        case "Obsolete":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.createLifecycle(obj, "obsolete",store);
                            }
                            break;
                        case "Deprecated":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.createLifecycle(obj, "deprecated",store);
                            }
                            break;
                        case "Experimental":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.createLifecycle(obj, "Experimental",store);
                            }
                            break;
                        case "Example":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.createLifecycle(obj, "Example",store);
                            }
                            break;
                        case "LikelyToChange":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.createLifecycle(obj, "LikelyToChange",store);
                            }
                            break;
                        case "PassedByReference":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                obj.psBR = true;
                                parsers.parseOpenModelatt(obj,store);
                            }
                            break;
                        case "Specify":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.parseSpecify(obj,store);
                            }
                            break;
                        case "RootElement":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                parsers.parseRootElement(obj,store);
                            }
                            break;
                        //add StrictComposite & ExtendedComposite
                        case "StrictComposite":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                //obj.isleafRef = false;
                                parsers.parseStrictCom(obj,store);
                            }
                            break;
                        case "ExtendedComposite":
                            newxmi = xmi[key].array ? xmi[key].array : xmi[key];
                            var len = xmi[key].array ? xmi[key].array.length : 1;
                            for(var i = 0; i < len; i++){
                                obj = len === 1 ? newxmi : newxmi[i];
                                //obj.isLeafRef = false;
                                parsers.parseExtendedCom(obj,store);
                            }
                            break;
                        default :
                            break;
                    }
                }

                for(var key in xmi){
                    switch(key){
                        case "uml:Package":
                            flag = 1;
                            newxmi = xmi[key];                //newxmi:xmi["uml:package"]
                            parsers.parseUmlModel(newxmi,undefined,store);          //parse umlModel
                            break;
                        case "uml:Model":
                            flag = 1;
                            newxmi = xmi[key];
                            parsers.parseUmlModel(newxmi,undefined,store);
                            break;
                        default :
                            break;
                    }
                }

                if(flag === 0){
                    console.log("[Parse] " + "Can not find the tag 'uml:Package' or 'uml:Model' of" + file + "! Please check out the xml file");
                }
            } else {
                if (model["uml:Package"] || model["uml:Model"]) {
                    flag = 1;

                    if(model["uml:Package"]){
                        newxmi = model["uml:Package"];
                    }

                    if(model["uml:Model"]){
                        newxmi = model["uml:Model"];
                    }

                    parsers.parseUmlModel(newxmi,undefined,store);
                } else {
                    console.log("[Parse] " + "empty file!");
                }
            }
            console.log("[Parse] " + "Parse " + file + " successfully!");
            return;
        }
    });
}

function buildResult(opts,cb){
    builders.buildGeneralization(store.Class, store);

    for(var i = 0; i < store.generalization.length; i++) {
        builders.inheritKey(store.generalization[i], store);
    }

    for(var i = 0; i < store.Class.length; i++){
        builders.steps.processPath(store.Class[i], store);
    }

    builders.steps.processGrouping(store.Class,store);

    builders.classspec(store.abstraction,config.withSuffix,store);

    for(var i = 0; i < store.augment.length; i++){
        var aug = store.augment[i];
        for(var  j = 0; j < store.yangModule.length; j++){
            var ym = store.yangModule[j];
            if(aug.fileName == ym.fileName){
                ym.children.push(aug);
            }
        }
    }

    for(var i = 0; i < store.Identity.length; i++){
        var identity = store.Identity[i];
        for(var  j = 0; j < store.packages.length; j++){
            var package = store.packages[j];
            if(identity.fileName == package.fileName && package.name.toLowerCase()=="typedefinitions"){
                package.children.push(identity);
            }
        }
    }

    for(var i = 0; i < store.Class.length; i++){
        var path = store.Class[i].instancePath;
        for(var j = 0; j < store.augment.length; j++){
            if(store.augment[j].client === path.split('/')[0].split(":")[1] || store.augment[j].client === path.split('/')[0].split(":")[1] + '-g'){
                if(store.Class.instancePathFlag !== false){
                    store.Class.instancePathFlag = true; // [sko] shall it be " = " only?
                }
                store.Class[i].instancePath = path.replace(path.split('/')[0], store.augment[j].supplier);
                break;
            }
        }
    }

    builders.obj2yang(store.Class, store, config);

    builders.crossRefer(store.yangModule, store);

    for(var i = 0; i < store.yangModule.length; i++) {
        var ym = store.yangModule[i];
        if (ym.children.length > 0) {
            (function () {
                try {
                    var st = yangProcessors.writeYang(ym);//print the module to yang file
                    var path = opts.yangDir + "/" + ym.name + "@" + ym.revision[0].date + '.yang';
                    console.log("[parser] writing " + path);
                    fs.writeFile(path, st, function(error){
                        if(error){
                            console.error(error.stack);
                            throw(error.message);
                        }
                        cb("write sucessful!");
                    });
                } catch (e) {
                    console.error(e.stack);
                    throw(e.message);
                }
            })();
        }
    }

}

module.exports = {
    setConfig:setConfig,
    setConfigs:setConfigs,
    setCurrentFilename:setCurrentFilename,
    parseFiles:parseFiles,
    buildResult:buildResult
};
