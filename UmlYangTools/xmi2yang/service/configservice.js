var fs     = require('fs'),
    moment = require('moment'),
    _      = require('lodash');

function loadConfig(opts){
    if(fs.existsSync(opts.config)){
        try {
            var config = JSON.parse(fs.readFileSync(opts.config, 'utf8'));
        } catch(e){
            var errMsg = "There was a problem reading " + opts.config + ". Error: " + e;
            console.error(errMsg);
            throw "failed to load configuration " + opts.config;
        }

        _.forEach(config,function(cfg){
            if(_.isPlainObject(cfg)) {
                cfg.projectDir = opts.projectDir;
                cfg.configFileName = opts.config;
            }
        });
        config.projectDir = opts.projectDir;
        config.configFileName = opts.config;
        return config;
    } else {
        var errMsg = "The file " + opts.config + " does not exist in the dir " + opts.projectDir +". Please add a configuration file and try again."
        console.error(errMsg);
        throw "File " + opts.config + " Not Found Exception.";
    }
}

function parseHtml(obj){
    for(var key in obj){
        if(_.isPlainObject(obj[key])){
            parseHtml(obj[key]);
        } else if(_.isString(obj[key])) {
            obj[key] = obj[key].replace(/<br \/>/g,"\r\n");
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

function readProjectDir(opts,cb){
    var filesToProcess = [];
    return fs.readdir(opts.projectDir, function(err, files){
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

function processArgs(opts){
    var argv = require('minimist')(process.argv.slice(2),{
        alias: { h: 'help', v: 'version' },
        string: ["c","d","o"],
        boolean: [ "help" ],
        default: {
            d: './project'
        },
        unknown: function (arg) { console.log("xmi2yang: invalid option '" + arg + "'");  process.exit(1);} /* invoked on unknown param */
    });

    if(argv['help']){
        console.log("Usage:   node main.js [options]\n" +
            "\nConverts XML/UML to Yang\n" +
            "Options\n" +
            "\t-c\t\t specify path to config.json, default: specified project directory/config.json\n" +
            "\t-d\t\t specify project directory, default: ./project\n" +
            "\t-o\t\t specify output directory for generated yang files, default: specified project directory\n" +
            "\t-h, --help\t print usage information\n\n" +
            "Example: node main.js -d /opt/project -c /etc/config.json -o /opt/project/yang\n");
        process.exit(0);
    } else {
        if(_.isString(argv["d"])){
            //We default config and yang output to project directory
            opts.projectDir = argv["d"];
            opts.config = argv["d"] + "/config.json";
            opts.yangDir = argv["d"];
        }

        if(_.isString(argv["c"])){
            opts.config = argv["c"];
        }

        if(_.isString(argv["o"])){
            opts.yangDir = argv["o"];
        }
        console.log("------------------------");
        console.log("Project Directory:",opts.projectDir);
        console.log("Configuration Path:",opts.config);
        console.log("Yang Output Path:",opts.yangDir);
        console.log("------------------------");
    }

    return opts;
}

module.exports = {
    loadConfig:loadConfig,
    parseHtml:parseHtml,
    validateConfig:validateConfig,
    readProjectDir:readProjectDir,
    processArgs:processArgs
};
