module.exports = Api;

function Api() {
  this.s = '';
}

Api.prototype.concat = function concat(sub, cb) {
  process.nextTick(function() {
    this.s = this.s.concat(sub);
    cb(null);
  }.bind(this));
}

Api.prototype.getError = function getError(text, cb) {
  process.nextTick(function() {
    cb(new Error(text));
  }.bind(this));
}
