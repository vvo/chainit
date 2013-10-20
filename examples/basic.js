module.exports = Basic;

function Basic() {
  this.i = 0;
  this.s = '';
}

Basic.prototype.concat = function concat(s, cb) {
  this.s = this.s.concat(s);
  setTimeout(cb, 200, null);
}

Basic.prototype.add = function add(i, cb) {
  this.i += i;
  cb(null);
}