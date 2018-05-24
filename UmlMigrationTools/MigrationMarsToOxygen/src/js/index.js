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
// import child = require('child_process')
var exec = require('child_process').exec;
var sourceFolder = './source';
var targetFolder = './target';
var tempFolder = './temp';
var mapping = new Map();
mapping.set("xmlns:", "xmlns-");
mapping.set("ecore:", "ecore-");
mapping.set("RootElement:", "RootElement-");
mapping.set("OpenModel_Profile:", "OpenModel_Profile-");
mapping.set("uml:", "uml-");
mapping.set("xsi:", "xsi-");
mapping.set("xmi:", "xmi-");
mapping.set("notation:Diagram", "notation-Diagram");
mapping.set("uml:Model", "uml-Model");
mapping.set("uml:Package", "uml-Package");
mapping.set("uml:Profile", "uml-Profile");
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
            return console.error(err);
        }
        console.info('Finished! Please check:', outFileName);
    });
}
// scan source folder
fs.readdirSync(sourceFolder).forEach(function (file) {
    // copy not modified files to target
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
            './src/xslt/merge.xslt',
            '-o:' + tempFolder + '/' + file.name() + '.' + toBeModifiedExtension + '.temp',
            'model=' + file.name(),
            'sourceFolder=../../' + tempFolder
        ].join(' ');
        console.info('executing:', params);
        var child = exec(params, function (error, stdout, stderr) {
            if (error !== null) {
                console.log("Error -> " + error);
            }
            console.log(stdout);
            console.log(stderr);
            console.log('translated');
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
});
