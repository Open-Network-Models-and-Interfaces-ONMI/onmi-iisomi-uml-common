var fs     = require('fs'),
    moment = require('moment'),
    _      = require('lodash'),
    parser = require('./parser');

var projectDir = "./project";

function loadConfig(filename){
    var path = projectDir + "/" + filename;
    if(fs.existsSync(path)){
        try {
            var config = JSON.parse(fs.readFileSync(path, 'utf8'));
        } catch(e){
            var errMsg = "There was a problem reading " + filename + ". Error: " + e;
            console.error(errMsg);
            throw "failed to load configuration " + filename;
        }

        _.forEach(config,function(cfg){
            if(_.isPlainObject(cfg)) {
                cfg.projectDir = projectDir;
                cfg.configFileName = filename;
            }
        });
        config.projectDir = projectDir;
        config.configFileName = filename;
        return config;
    } else {
        var errMsg = "The file " + filename + " does not exist in the dir " + projectDir +". Please add a configuration file and try again."
        console.error(errMsg);
        throw "File " + filename + " Not Found Exception.";
    }
}

function parseHtml(obj){
    for(var key in obj){
        if(_.isPlainObject(obj[key])){
            parseHtml(obj[key]);
        } else if(_.isString(obj[key])) {
            obj[key] = obj[key].replace(/<br\/>/g,"\r\n");
            obj[key] = obj[key].replace(/<br>/g,"\r\n");
        }
    }
}

function validateConfig(config){
    //traverse object and replace <br> with "\r\n"
    parseHtml(config);
    var dateFormat = 'YYYY-MM-DD';
    if(config.revision.date) {
        var date = moment(config.revision.date);
        if(!date.isValid()){
            var errMsg = "The revision date provided is invalid. Please correct date to be in the format of YYYY-MM-DD";
            console.error(errMsg);
            throw (errMsg);
        }
    } else {
        config.revision.date = moment().format(dateFormat);
    }
}

function readProjectDir(cb){
    var filesToProcess = [];
    return fs.readdir(projectDir, function(err, files){
        if(err){
            console.error(err.stack);
            throw err.message;
        }
        _.forEach(files,function(file){
            if(file.endsWith('xml') || file.endsWith('uml')){
                filesToProcess.push(file);
            }
        });
        cb(filesToProcess);
    });
}

function main() {
    var configs = loadConfig("config.json");
    _.forOwn(configs,function(config){
        if(_.isPlainObject(config)) {
            validateConfig(config);
        }
    });

    readProjectDir(function(files){
        if(files.length > 0) {
            console.log("[App] " + "Processing the following files: ",files.toString());
            parser.setConfigs(configs);
            parser.parseFiles(files);
            parser.buildResult(function(success){
                console.log("[App] " + success);
                process.exit();
            });
        } else {
            console.log("[App] " + "There is no .xml file in " + configs.projectDir + " directory! Please check your files path");
            process.exit();
        }
    });
}
main();