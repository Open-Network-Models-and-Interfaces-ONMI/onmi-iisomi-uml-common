const fs = require('fs');
const debug = require('util').debuglog('test-helper')
const proc = require('process');
const exec = require('child_process').exec;
const yang = require('yang-js');
const baseDir = proc.cwd();

const testHelper = module.exports = {
  parseYang: (yangString, callback) => {
    try {
      const yangJSON = yang.parse(yangString).toJSON();
      debug('yang JSON', JSON.stringify(yangJSON));
      callback(null, yangJSON);
    } catch (e) {
      callback(e, {});
    }
  },
  transform: (modelName, yangFileName, callback) => {
    testHelper.generateYang(modelName, (err) => {
      if (err) return callback(err);
      testHelper.readResult(modelName, yangFileName, callback);
    });
  },
  generateYang: (modelName, done) => {
    proc.chdir(`test/data/${modelName}`);
    // generate the Yang file into test/data/modelName/project/modelName.yang 
    // This is being called with exec because main.js does not have module.exports
    // Replace with a direct call for the refactored version
    debug(`generating yang for ${modelName} in working directory ${process.cwd()}`);
    var generate = exec(`node ${baseDir}/main.js`);
    generate.stdout.on('data', (data) => {
      debug(`generate yang: ${data}`);
    });
    generate.stderr.on('data', (data) => {
      debug(`generate yang err: ${data}`);
    });
    generate.on('close', (statusCode) => {
      debug(`generate yang completed, status: ${statusCode}`);
      proc.chdir(baseDir);
      done();
    });
  },
  readResult: (modelName, yangFileName, callback) => {
    const expectedFilePath = `test/data/${modelName}/expected/${yangFileName}.yang`;
    debug(`Reading expected yang from ${expectedFilePath}`);
    const expected = fs.readFileSync(expectedFilePath).toString().trim();

    const actualFilePath = `test/data/${modelName}/project/${yangFileName}.yang`;
    debug(`Reading actual generated yang from ${actualFilePath}`);
    const actual = fs.readFileSync(actualFilePath).toString().trim();
    
    // actual comparison is performed in callback
    callback(null, actual, expected);
  },
  setUp: (done) => {
    proc.chdir(baseDir);
    done();
  },
  tearDown: (modelName, done) => {
    proc.chdir(baseDir);
    const modelProjectDir = `test/data/${modelName}/project`;
    fs.readdir(modelProjectDir, (err, fileList) => {
      fileList.filter(f => f.match(/.*\.yang/ig)).forEach((fileName) => {
        fs.unlinkSync(`${modelProjectDir}/${fileName}`);
      });
      done();
    });
  }
}
