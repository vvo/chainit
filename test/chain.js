describe('chaining an Api', function() {
  var assert = require('assert');
  var Api = require('./fixtures/api.js');
  var chainit = require('../index.js');
  var ChainApi = chainit(Api);
  var o;

  beforeEach(function() {
    o = new ChainApi();
  });

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

  it('propagates context to callbacks', function(done) {
    o
      .concat('con', function() {
        this
          .concat('text', function() {
            assert.equal(this.s, 'context');
            done(null);
          });
      })
  })

  it('propagates callback arguments', function(done) {
    o
      .concat('er')
      .concat('ror', function() {
        this.getError('some text error', function(err) {
          assert.equal(err.message, 'some text error');
          done(null);
        })
      })
  })

  it('supports nextTicked calls', function(done) {
    o
      .concat('ne', function() {
        process.nextTick(function() {
          o.concat('xt', function() {
            process.nextTick(function() {
              process.nextTick(function() {
                o.concat('Tick', function() {
                  assert.equal(this.s, 'nextTick');
                  done(null);
                })
              })
            })
          })
        })
      })
  });

  it('supports methods calling methods', function(done) {
    o
      .tripleConcat('one', function() {
        this.tripleConcat('two');
      })
      .tripleConcat('four', function() {
        assert.equal(o.s, 'one1-one2-one3-two1-two2-two3-four1-four2-four3-');
        done();
      });
  });

 it('supports nested and subsequent calls', function(done) {
    o
      .concat('s')
      .call(function() {
        o
          .concat('a', function() {
            o.concat('l')
            .call(function() {
              o.concat('u', function() {
                o.call(function() {
                  o.call(function() {
                    o.concat('t')
                  })
                })
              })
              .concat(' ')
            })
            .concat('ç')
          })
          .concat('a')
      })
      .concat('', function() {
        o
          .call(function() {})
          .concat(' v', function() {
            o.call(function() {
              o.concat('a');
            }).concat(' ?').concat('?', function() {
              assert.equal(o.s, 'salut ça va ??');
              done();
            })
        })
      })
  });


  it('support crazy own chains', function(done) {
    o.multiConcat('multi', function() {
      assert.equal(o.s, 'a-b-c-d-e-f-g-h-i-j-k-l-m-n-o-p-q-')
      done();
    })
  })

  it('supports outside nextTick', function(done) {
    o.concat('one');
    process.nextTick(function() {
      o.concat('two').concat('three', function() {
        assert.equal(this.s, 'onetwothree')
        done();
      })
    })
  })

  it('supports functions', function(done) {
    o.concat('one', named);

    function named() {
      o
        .tripleConcat('two')
        .tripleConcat('three', function() {
          assert.equal(this.s, 'onetwo1-two2-two3-three1-three2-three3-')
          done();
        })
    }
  })

});