module.exports = Api;

function Api() {
  this.i = 0;
}

Api.prototype.add = function add(n, cb) {
  if (typeof n === 'function') {
    cb = n;
    n = 1;
  }

  process.nextTick(function() {
    this.i += n;
    cb(null);
  }.bind(this));
}