
const helper = require('../helper');
const { expect } = require('chai');
let modelName;

// Run tests with "NODE_DEBUG=test-helper npm run test" for debug info

describe('Generate Yang from simple sample XMI models', () => {
  before((done) => helper.setUp(done));
  afterEach((done) => helper.tearDown(modelName, done));

  describe('Mapping from SimpleMainClassModel', () => {
    let actual;
    let expected;
    let model;
    before((done) => {
      modelName = 'SimpleMainClassModel';
      helper.transform(modelName, 'simple-main-class-model', (err, actualYangString, expectedYangString) => {
        helper.parseYang(actualYangString, (err, parsedYang) => {
          actual = parsedYang;
          expect(actual.module).to.have.property('simple-main-class-model');
          model = actual.module['simple-main-class-model'];
          done();
        })
      });
    });

    it('should use kebab-case model name', (done) =>  {
      expect(model.namespace).to.equal('urn:onf:params:xml:ns:yang:simple-main-class-model');
      expect(model.prefix).to.equal('simple-main-class-model');
      done();
    });
    it.skip('should ...', (done) =>  {
      // assertions go here
      done();
    });
  });

  it('should map CommonModel to Yang', (done) => {
    modelName = 'CommonModel';
    helper.transformAndCompare(modelName, 'common-model', (err, actual, expected) => {
      // Replace with specific checks
      expect(actual).to.equal(expected);
      done();
    });
  });
});
