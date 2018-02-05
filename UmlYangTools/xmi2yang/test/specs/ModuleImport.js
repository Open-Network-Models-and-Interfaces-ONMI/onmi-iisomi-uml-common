
const helper = require('../helper');
const { expect } = require('chai');
const yang = require('yang-js');
let modelName;

// Run tests with "NODE_DEBUG=test-helper npm run test" for debug info

describe('UML module import', () => {
    before((done) => helper.setUp(done));
    afterEach((done) => helper.tearDown(modelName, done));

    describe('UML module import', () => {
        let model;
        before((done) => {
            modelName = 'ModuleImport';
            helper.transform(modelName, 'module-import', (err, actualYangString, expectedYangString) => {
                helper.parseYang(actualYangString, (err, parsedYang) => {
                    model = parsedYang.module['module-import'];
                    done();
                })
            });
        });

        it('module import statement', (done) => {
            expect(model['import'])
                .to.have.property('handy-types');
            done();
        });

        it('module import prefix', (done) => {
            expect(model['import']['handy-types'].prefix)
                .to.equal('handy-types');
            done();
        });

        it('usage of type definition', (done) => {
            let properties = model.grouping['sample-class'].leaf;
            expect(properties['handy-thing'].type)
                .to.equal('handy-types:handy-data-type');
            done();
        });
    });
});
