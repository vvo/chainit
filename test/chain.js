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
    o.s = '';
  })

  it('has an s prop', function() {
    assert.equal(o.s, '');
  });

  it('supports individuals calls', function(done) {
    o.concat('he');
    o.concat('llo', function() {
      assert.equal(o.s, 'hello');
      done(null);
    });
  });

  it('supports chained calls', function(done) {
    o
      .concat('ho')
      .concat('la', function() {
        assert.equal(o.s, 'hola');
        done(null);
      });
  });

  it('supports nested calls', function(done) {
    o
      .concat('sa', function() {
        o
          .concat('l')
      })
      .concat('ut', function() {
        assert.equal(o.s, 'salut');
        done(null);
      })
  })

  it('supports deeply nested calls', function(done) {
    o
      .concat('s', function() {
        o
          .concat('a')
          .concat('l', function() {
            o.concat('u')
            o.concat('t')
            o.concat(' ça ', function() {
              o.concat('va')
            })
          })
      })
      .concat(' ?', function() {
        assert.equal(o.s, 'salut ça va ?');
        done(null);
      })
  })
});