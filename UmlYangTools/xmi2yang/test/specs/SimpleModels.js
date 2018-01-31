
const helper = require('../helper');
const { expect } = require('chai');
let modelName;

// Run tests with "NODE_DEBUG=test-helper npm run test" for debug info

describe('Generate Yang from simple sample XMI models', () => {
  before((done) => helper.setUp(done));
  afterEach((done) => helper.tearDown(modelName, done));

  it('should map SimpleMainClassModel to Yang', (done) => {
    modelName = 'SimpleMainClassModel';
    helper.validateYang(modelName, 'simple-main-class-model', (err, actual, expected) => {
      expect(actual).to.equal(expected);
      done();
    });
  });

  it('should map CommonModel to Yang', (done) => {
    modelName = 'CommonModel';
    helper.validateYang(modelName, 'common-model', (err, actual, expected) => {
      // Replace with specific checks
      expect(actual).to.equal(expected);
      done();
    });
  });

});