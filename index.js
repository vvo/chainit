module.exports = chainit;

function chainit(Constructor) {
  // var queue = require('queue');

  var methods = Object.keys(Constructor.prototype);
  methods.forEach(function(name) {
    var original = Constructor.prototype[name];
    var fName = Constructor.prototype[name].name || name;
    var chained = function() {
      original.apply(this, arguments);
      return this;
    }

    chained.name = fName;
    Constructor.prototype[name] = chained;
  });

  return Constructor;
}