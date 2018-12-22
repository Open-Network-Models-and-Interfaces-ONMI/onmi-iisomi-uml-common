"use strict";
/*
 * (C) Copyright 2018 highstreet technologies (http://highstreet-technologies.com) and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Contributors:
 *     Martin Skorupski [martin.skorupski@highstreet-technologies.com]
 */
Object.defineProperty(exports, "__esModule", { value: true });
// Global interface implementations 
String.prototype.extension = function () {
    var strings = this.split('.');
    if (strings.length > 0) {
        return strings[strings.length - 1];
    }
    return '';
};
String.prototype.name = function () {
    var strings = this.split('.');
    if (strings.length > 1) {
        return strings[strings.length - 2];
    }
    return '';
};
// Start application
var fs = require("fs");
var ConfigLog4j_1 = require("./ConfigLog4j");
// import child = require('child_process')
var log = ConfigLog4j_1.factory.getLogger(process.argv[2] || 'migrate');
var command = process.argv[2] || 'clean';
var xsltLogLevel = 'INFO ';
if (process.argv.join(' ').includes('--xsltLogLevel=DEBUG')) {
    xsltLogLevel = 'DEBUG';
}
log.info(function () { return "     command= " + command; });
log.info(function () { return "xsltLogLevel= " + xsltLogLevel; });
var exec = require('child_process').exec; // TODO use spawn instead!
// const spawn = require('child_process').spawn;
var sourceFolder = './source';
var targetFolder = './target';
var tempFolder = './temp';
var mapping = new Map();
mapping.set("xmlns:", "xmlns-");
mapping.set("css:", "css-");
mapping.set("ecore:", "ecore-");
mapping.set("notation:Diagram", "notation-Diagram");
mapping.set("notation:IdentityAnchor", "notation-IdentityAnchor");
mapping.set("uml:Model", "uml-Model");
mapping.set("uml:Package", "uml-Package");
mapping.set("RootElement:", "RootElement-");
mapping.set("xsi:", "xsi-");
mapping.set("xmi:", "xmi-");
mapping.set("InterfaceModel_Profile:", "InterfaceModel_Profile-");
mapping.set("OpenModel_Profile:", "OpenModel_Profile-");
mapping.set("OpenModel_Profile_1:", "OpenModel_Profile_1-");
mapping.set("OpenModel_Profile_2:", "OpenModel_Profile_2-");
mapping.set("OpenModel_Profile_3:", "OpenModel_Profile_3-");
mapping.set("OpenInterfaceModel_Profile:", "OpenInterfaceModel_Profile-");
var toBeModifiedExtension = 'notation';
var extensionsForTemps = [toBeModifiedExtension, 'uml'];
if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder);
}
if (!fs.existsSync(tempFolder)) {
    fs.mkdirSync(tempFolder);
}
// enum
var Modification;
(function (Modification) {
    Modification[Modification["removeNamespaces"] = 0] = "removeNamespaces";
    Modification[Modification["addNamespaces"] = 1] = "addNamespaces";
})(Modification || (Modification = {}));
// functions
function modifiy(inFile, outFileName, direction) {
    var temp = inFile;
    if (direction === Modification.removeNamespaces) {
        mapping.forEach(function (value, key, map) {
            temp = temp.replace(new RegExp(key, 'g'), value);
        });
    }
    if (direction === Modification.addNamespaces) {
        mapping.forEach(function (value, key, map) {
            temp = temp.replace(new RegExp(value, 'g'), key);
        });
    }
    fs.writeFile(outFileName, temp, function (err) {
        if (err) {
            return log.error(function () { return "" + err.message; });
        }
        // log.info( () => `Finished! Please check: ${outFileName}`);
    });
}
// scan source folder
fs.readdirSync(sourceFolder).forEach(function (file) {
    // copy not modified files to target
    if (fs.lstatSync([sourceFolder, file].join('/')).isDirectory()) {
    }
    else {
        if (file.extension() !== toBeModifiedExtension) {
            fs.copyFileSync([sourceFolder, file].join('/'), [targetFolder, file].join('/'));
        }
        // prepare uml and notation for xslt
        if (extensionsForTemps.indexOf(file.extension()) !== -1) {
            var inFile = fs.readFileSync([sourceFolder, file].join('/'), 'utf8');
            var outFileName = [tempFolder, file].join('/');
            var modification = Modification.removeNamespaces;
            modifiy(inFile, outFileName, modification);
        }
        // process xslt
        if (file.extension() === toBeModifiedExtension) {
            var params = [
                'java',
                '-jar',
                './src/lib/saxon9he.jar',
                tempFolder + '/' + file.name() + '.' + toBeModifiedExtension,
                './src/xslt/' + command + '.xslt',
                '-o:' + tempFolder + '/' + file.name() + '.' + toBeModifiedExtension + '.temp',
                'model=' + file.name(),
                'sourceFolder=../../' + tempFolder,
                'xsltLogLevel=' + xsltLogLevel
            ].join(' ');
            log.info('executing: ' + params);
            var child = exec(params, { maxBuffer: 1024 * 500 }, function (error, stdout, stderr) {
                if (error !== null) {
                    log.error(function () { return "" + error; });
                }
                log.info(function () { return "xslt-message: " + stdout; });
                log.info(function () { return "  xslt-error: " + stderr; });
                // post processing
                fs.readdirSync(tempFolder).filter(function (file) {
                    return file.extension() === 'temp';
                }).forEach(function (file) {
                    var inFile = fs.readFileSync([tempFolder, file].join('/'), 'utf8');
                    var newFileNameParts = file.split('.');
                    newFileNameParts.pop();
                    var newFileName;
                    if (newFileNameParts !== undefined) {
                        newFileName = newFileNameParts.join('.');
                    }
                    else {
                        newFileName = 'temp';
                    }
                    ;
                    var outFileName = [targetFolder, newFileName].join('/');
                    var modification = Modification.addNamespaces;
                    modifiy(inFile, outFileName, modification);
                });
            });
        }
    }
});
