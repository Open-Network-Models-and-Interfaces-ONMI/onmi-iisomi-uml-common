var _       = require('lodash'),
    service = require('./service/configservice'),
    parser  = require('./parser');


function main() {
    var opts = {
        projectDir:"",
        config:"",
        yangDir:""
    };

    opts = service.processArgs(opts);

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
                 process.exit();
             });
         } else {
             console.log("[App] " + "There is no .xml file in " + configs.projectDir + " directory! Please check your files path");
             process.exit();
         }
    });
}
main();
