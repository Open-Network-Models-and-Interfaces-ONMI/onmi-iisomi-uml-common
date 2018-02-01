const util = require("../../../../model/yang/util");
const _ = require("lodash");
const expect = require('chai').expect;
describe('model/yang/util', function() {
    describe('#yangifyName()', function () {
        it('test name formatting', function () {
            var names  = ["MEF_Common","NRM_Connectivity","TapiCommon","TapiTopology"];
            var results = ["mef-common","nrm-connectivity","tapi-common","tapi-topology"];
            _.forEach(names,function(val, index, array){
                var name = util.yangifyName(val);
                //assert.equal(name === results[index], true);
                expect(name).to.equal(results[index]);
            });
        });
    });
    describe('#typeifyName()', function () {
        it('test type name formatting', function () {
            var names  = ["AdminState","AggLinkDepth","AvailableMegLevel","ColorFieldType"];
            var results = ["admin-state","agg-link-depth","available-meg-level","color-field-type"];
            _.forEach(names,function(val, index, array){
                var name = util.yangifyName(val);
                //assert.equal(name === results[index], true);
                expect(name).to.equal(results[index]);
            });
        });
    });
});