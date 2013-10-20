module.exports = chainit;

function chainit(Constructor) {
  var Queue = require('queue');
  var q = new Queue({
    timeout: 0,
    concurrency: 1
  });
  var curIdx = 0;

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

      var task = function(cb) {
        args.push(function() {
          curIdx = q.indexOf(task);
          if (customCb) {
            customCb();
          }
          cb();
        });

        original.apply(self, args);
      }

      q.splice(curIdx + 1, 0, task);
      curIdx += 1;

      return this;
    }

    Constructor.prototype[name] = chained;
  });

  return Constructor;
}