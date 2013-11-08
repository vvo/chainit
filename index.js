module.exports = chainit;

function chainit(Constructor) {
  var Queue = require('queue');
  var queues = [];
  var currentDepth = 0;

  function pushTo(depth, task) {
    var queue = queues[depth] || (queues[depth] = getNewQueue(depth));
    queue.push(task);
  }

  function getNewQueue(newDepth) {
    var queue = new Queue({
      timeout: 0,
      concurrency: 1
    });

    queue.on('drain', function() {
      if (newDepth > 0) {
        wakeupChain(newDepth);
      }

      if (!queues.slice(newDepth).some(hasPending)) {
        currentDepth = newDepth;
      }
    });

    function wakeupChain(depth) {
      if (!queues[depth + 1] ||
        !queues.slice(depth).some(hasPending)) {
        queues[depth - 1].concurrency = 1;
        queues[depth - 1].process();
      }

      if (depth > 1) {
        wakeupChain(depth - 1);
      } else {
        if (!queues.some(hasPending)) {
          depth = 0;
        }
      }
    }

    return queue;
  }

  var methods = Object.keys(Constructor.prototype);
  methods.forEach(function(name) {
    var original = Constructor.prototype[name];

    var chained = function() {
      var ctx = this;
      var args = Array.prototype.slice.call(arguments);
      var customCb;
      if (typeof args[args.length - 1] === 'function') {
        customCb = args.pop();
      }

      var ldepth = currentDepth;


      if (currentDepth > 0 && queues[currentDepth - 1].concurrency > 0) {
        queues[currentDepth - 1].concurrency = 0;
      }

      var task = function(cb) {
        currentDepth = ldepth + 1;

        args.push(function() {
          var cbArgs = arguments;

          if (customCb) {
            customCb.apply(ctx, cbArgs);
          }

          cb();
        });

        original.apply(ctx, args);
      }

      pushTo(currentDepth, task);
      return this;
    }

    Constructor.prototype[name] = chained;
  });

  return Constructor;
}

function hasPending(queue) {
  return queue.length >= 1;
}