module.exports = chainit;

function chainit(Constructor) {
  var Queue = require('queue');
  var q = new Queue({
    timeout: 0,
    concurrency: 1
  });

  var methods = Object.keys(Constructor.prototype);
  methods.forEach(function(name) {
    var original = Constructor.prototype[name];
    var fName = Constructor.prototype[name].name || name;

    var chained = function() {
      var self = this;
      var args = Array.prototype.slice.call(arguments);
      var customCb;
      if (typeof args[args.length - 1] === 'function') {
        customCb = args.pop();
      }

      q.push(function(cb) {
        if (customCb) {
          args.push(function() {
            customCb();
            cb();
          })
        } else {
          args.push(cb);
        }

        original.apply(self, args);
      });

      return this;
    }

    chained.name = fName;
    Constructor.prototype[name] = chained;
  });

  return Constructor;
}