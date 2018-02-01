var _       = require('lodash'),
    service = require('./service/configservice'),
    parser  = require('./parser');


module.exports = function main(opts, callback) {
    if (!opts) {
        opts = {
            projectDir:"",
            config:"",
            yangDir:""
        };
        opts = service.processArgs(opts);
    }

    var configs = service.loadConfig(opts);
    _.forOwn(configs,function(config){
        if(_.isPlainObject(config)) {
            service.validateConfig(config);
        }
    });

    service.readProjectDir(opts,function(files){
         if(files.length > 0) {
             console.log("[App] " + "Processing the following files: ",files.toString());
             parser.setConfigs(configs);
             parser.parseFiles(files);
             parser.buildResult(opts,function(success){
                 console.log("[App] " + success);
                 if (callback) return callback();
                 else process.exit();

             });
         } else {
             const errorMessage = `[App] There is no .xml or .uml file in ${configs.projectDir} directory! Please check your files path`;
             console.log(errorMessage);
             if (callback) return callback(errorMessage);
             else process.exit();

         }
    });
}

