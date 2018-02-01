
const helper = require('../helper');
const { expect } = require('chai');
let modelName;

// Run tests with "NODE_DEBUG=test-helper npm run test" for debug info

describe('Name mapping to YANG kebab-case', () => {
    before((done) => helper.setUp(done));
    afterEach((done) => helper.tearDown(modelName, done));

    describe('Attribute name mapping', () => {
        let model;
        before((done) => {
            modelName = 'AttributeNaming';
            helper.transform(modelName, 'attribute-naming', (err, actualYangString, expectedYangString) => {
                helper.parseYang(actualYangString, (err, parsedYang) => {
                    model = parsedYang.module['attribute-naming'];
                    done();
                })
            });
        });

        it('simple camel case attribute name', (done) =>  {
            expect(model.grouping['test-class'].leaf)
                .to.have.property('camel-case-attribute');
            done();
        });
        it.skip('tricky camel case attribute name', (done) =>  {
            expect(model.grouping['test-class'].leaf)
                .to.have.property('an-xyz-thing');
            done();
        });
        it('attribute name containing number', (done) =>  {
            expect(model.grouping['test-class'].leaf)
                .to.have.property('embed-1024-numeric');
            done();
        });
        it('simple camel case association end', (done) =>  {
            expect(model.grouping['test-class']['leaf-list'])
                .to.have.property('another-class');
            done();
        });
        it('enum literal', (done) =>  {
            expect(model.typedef['test-enum'].type.enumeration['enum'])
                .to.have.property('UNKNOWN');
            done();
        });
        it('enum literal with underscore', (done) =>  {
            expect(model.typedef['test-enum'].type.enumeration['enum'])
                .to.have.property('SOME_VALUE');
            done();
        });
  });
});
