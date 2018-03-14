const service = require('../../../service/configservice');
const assert = require('chai').assert;
const _ = require('lodash');
describe('service/configservice', function() {
    describe('#parseHtml(obj)', function() {
        it('remove html line breaks', function() {
            var br1 = {
                "config": {
                    "organization": "Test Parse<br />"
                }
            };
            service.parseHtml(br1);
            assert.equal(br1.config.organization == "Test Parse\r\n", true);

            var br2 = {
                "config": {
                    "organization": "Test Parse<br>"
                }
            };
            service.parseHtml(br2);
            assert.equal(br2.config.organization == "Test Parse\r\n", true);

            var br3 = {
                "config": "Test Parse<br/>"
            };
            service.parseHtml(br3);
            assert.equal(br3.config == "Test Parse\r\n", true);
        });
    });
    describe('#validateConfig(config)', function() {
        it('validate revision date', function () {
            service.validateConfig({
                "namespace":"urn:tst:yang:",
                "organization":"Test Organization",
                "contact":"TST",
                "withSuffix":false,
                "revision": {
                    "date":new Date(),
                    "description":"TST NRP 1.0.alpha",
                    "reference":"ONF-TR-527, ONF-TR-512, ONF-TR-531, RFC 6020 and RFC 6087"
                }
            });
            assert.equal(true, true);
        });
    });
    describe('#readProjectDir(opts,cb)', function() {
        it('read files from project dir', function () {
            service.readProjectDir({projectDir:"./project"},function(files){
                assert.equal(files.length === 0, true);
            });
        });
    });
    describe('#loadConfig(opts)', function() {
        it('retrieve config', function () {
            var config = service.loadConfig({
                projectDir:"./project",
                config:"./project/config.json",
                yangDir:"./yang"
            });
            assert.equal(_.isEmpty(config), false);
        });
    });
    describe('#processArgs(opts)', function() {
        it('process parameters', function() {
            var args = [
                "/usr/bin/node",
                "../../../app.js",
                "-d",
                "../../../project",
                "-o",
                "../../../yang"
            ];
            var oldArgs = process.argv;
            process.argv = args;

            var vals = {
                projectDir:"",
                config:"",
                yangDir:""
            };
            var opts = service.processArgs(vals);
            //Revert back before evaluation
            console.log(opts);
            process.argv = oldArgs;
            assert.equal(opts.projectDir == "../../../project", true);
            assert.equal(opts.config == "../../../project/config.json", true);
            assert.equal(opts.yangDir == "../../../yang", true);
        });
    });
});
