module.exports = Api;

function Api() {
  this.i = 0;
}

Api.prototype.add = function add(n) {
  this.i += n || 1;
}

Api.prototype.sub = function sub(n) {
  this.i -= n || 1;
}

Api.prototype.addAsync = function addAsync(n, cb) {
  process.nextTick(function() {
    this.add(n);
    cb(null);
  }.bind(this));
}