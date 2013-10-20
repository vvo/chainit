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

  it('supports async chaining', function(done) {
    o.add(3).add(2).add(function() {
      assert.equal(o.i, 6);
      done(null);
    });
  });

});