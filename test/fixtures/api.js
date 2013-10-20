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