module.exports = Api;

function Api(s) {
  this.s = s || '';
}

Api.prototype.concat = function concat(sub, cb) {
  this.s = this.s.concat(sub);
  setTimeout(cb, getRandomArbitrary(4, 30));
}

Api.prototype.slowConcat = function concat(sub, cb) {
  var api = this;
  setTimeout(function() {
    api.s = api.s.concat(sub);
    cb();
  }, getRandomArbitrary(100, 200));
}

Api.prototype.getError = function getError(text, cb) {
  setTimeout(function() {
    cb(new Error(text));
  }, getRandomArbitrary(4, 30));
}

Api.prototype.tripleConcat = function callConcat(prefix, cb) {
  this.concat(prefix + '1-', function() {
    this
    .concat(prefix + '2-')
    .concat(prefix + '3-', function() {
      process.nextTick(function() {
        setTimeout(cb, getRandomArbitrary(4, 20));
      })
    });
  });
}

Api.prototype.call = function call(cb) {
  process.nextTick(cb);
}

Api.prototype.multiConcat = function(prefix, cb) {
  this
    .concat('a-', function() {
      this
        .concat('b-', function() {
          this.concat('c-', function() {
            this.concat('d-').concat('e-', function() {
              this.concat('f-', function() {
                this.concat('g-').concat('h-').concat('i-', function() {
                  this.concat('j-')
                })
              })
            }).concat('k-')
          }).concat('l-')
        })
        .concat('m-')
        .concat('n-')
    })
    .concat('o-', function() {
      this.concat('p-').concat('q-', function() {
        setTimeout(cb, getRandomArbitrary(10, 20))
      })
    });
}

Api.getRandomArbitrary = getRandomArbitrary;

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
