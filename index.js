module.exports = chainit;

function chainit(Constructor) {
  var instances = [];
  var fns = [];

  var Chain = function Chain() {
    instances.push(this);
    fns[instances.indexOf(this)] = {};
    Constructor.apply(this, arguments);
  };

  Chain.prototype = Object.create(Constructor.prototype);

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

  var statics = Object.keys(Constructor).forEach(function(name) {
    Chain[name] = new Function(Constructor[name]);
  });

  var methods = Object.keys(Constructor.prototype);
  methods.forEach(function(name) {
    var original = Constructor.prototype[name];

    var chained = makeChain();

    function makeChain(fn) {

      return function chained() {
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

          if (typeof fn === 'function') {
            fn.apply(ctx, args);
          } else {
            original.apply(ctx, args);
          }
        }

        pushTo(currentDepth, task);
        return this;
      }
    }

    Object.defineProperty(Chain.prototype, name, {
      set: function(func) {
        if (this === Chain.prototype) {
          original = func;
        } else {
          fns[instances.indexOf(this)][name] = makeChain(func);
        }
      },
      get: function() {
        if (this === Chain.prototype || !fns[instances.indexOf(this)][name]) {
          return chained;
        } else {
          return fns[instances.indexOf(this)][name];
        }
      }
    });

  });

  return Chain;
}

function hasPending(queue) {
  return queue.length >= 1;
}