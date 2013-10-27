module.exports = chainit;

function chainit(Constructor) {
  var Queue = require('queue');
  var q = new Queue({
    timeout: 0,
    concurrency: 1
  });
  var curIdx = 0;
  var parent;

  var methods = Object.keys(Constructor.prototype);
  methods.forEach(function(name) {
    var original = Constructor.prototype[name];

    var chained = function() {
      if (parent === true) {
        q.pending -= 1;
      }

      var ctx = this;
      var args = Array.prototype.slice.call(arguments);
      var customCb;
      if (typeof args[args.length - 1] === 'function') {
        customCb = args.pop();
      }

      var task = function(cb) {
        parent = true;
        args.push(function() {
          parent = false;
          curIdx = q.indexOf(task);
          if (customCb) {
            customCb.apply(ctx, arguments);
          }
          cb();
        });

        original.apply(ctx, args);
      }

      q.splice(curIdx + 1, 0, task);
      curIdx += 1;

      return this;
    }

    Constructor.prototype[name] = chained;
  });

  return Constructor;
}