describe('chaining an Api', function() {
  var assert = require('assert');
  var Api = require('./fixtures/api.js');
  var chainit = require('../index.js');
  var o;

  before(function() {
    var ChainApi = chainit(Api);
    o = new ChainApi;
  });

  beforeEach(function() {
    o.i = 0;
  })

  it('has an i prop', function() {
    assert.equal(o.i, 0);
  });

  it('supports add and sub', function() {
    o.add();
    o.add();
    o.sub();
    assert.equal(o.i, 1);
  });

  it('supports chaining', function() {
    o.add().add().add();

    assert.equal(o.i, 3);
  });

});