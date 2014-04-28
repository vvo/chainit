module.exports = chainit;

function chainit(Constructor) {

  function Chain() {
    Constructor.apply(this, arguments);
  }

  Chain.prototype = Object.create(Constructor.prototype);

  var Queue = require('queue');
  var queues = [];
  var currentDepth = 0;
  var flushTimeout;
  var flushedTasks = [];

  function pushTo(depth, task) {
    var queue = queues[depth] || (queues[depth] = getNewQueue(depth));

    if (depth > 0) {
      return queue.push(task);
    }

    // hack to handle cases where first chained calls
    // are not added synchronously
    // it means first chain start will occur after 4ms max
    clearTimeout(flushTimeout);
    process.nextTick(function() {
      flushedTasks.unshift(function() {
        queue.push(task);
      });

      flushTimeout = setTimeout(flush, 4);
    });
  }

  function flush() {
    var addTask;
    while (addTask = flushedTasks.pop()) {
      addTask();
    }
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

  // static methods, not chained
  Object.keys(Constructor)
    .forEach(function(name) {
      Chain[name] = Constructor[name];
    });

  // prototype methods, chained
  var allFn = Object.keys(Constructor.prototype);

  if (allFn.length === 0) {
    allFn = Object.keys(Object.getPrototypeOf(Constructor.prototype));
  }

  allFn
    .forEach(function(fnName) {
      Chain.prototype[fnName] = makeChain(fnName, Constructor.prototype[fnName]);
    });

  function makeChain(fnName, fn) {

    return function chained() {
      var ctx = this;
      var callArguments = Array.prototype.slice.call(arguments);
      var args = Array.prototype.slice.call(arguments);
      var customCb;

      if (callArguments[callArguments.length - 1] instanceof Function) {
        callArguments.pop();
      }

      if((typeof args[args.length - 1] === 'function') && (!ctx.constructor || ctx.constructor.name !== 'WebdriverJs' || fnName.indexOf('execute') === -1 || args.length > 1)) {
        customCb = args.pop();
      }

      var ldepth = currentDepth;

      if (currentDepth > 0 && queues[currentDepth - 1].concurrency > 0) {
        queues[currentDepth - 1].concurrency = 0;
      }

      var task = function(cb) {
      process.nextTick(function() {
        currentDepth = ldepth + 1;

        args.push(function() {
          var cbArgs = arguments,
              err = arguments[0];

          if (err instanceof Error && typeof err.addToCallStack === 'function') {
            err.addToCallStack({
              name: fnName,
              args: niceArgs(callArguments)
            });
          } else if (err instanceof Error) {
            err.message = '[' + fnName + niceArgs(callArguments) + '] <= \n ' + err.message;
          }

          if (customCb) {
            customCb.apply(ctx, cbArgs);
          } else if (err instanceof Error) {
            // throw error if it isn't handled by a custom callback
            throw err;
          }

          cb();
        });

        fn.apply(ctx, args);
      });
      }

      pushTo(currentDepth, task);

      return this;
    }
  }

  Chain.prototype.__addToChain = function(fnName, fn) {
    this[fnName] = makeChain(fnName, fn);
  }

  return Chain;
}

chainit.add = function add(to, fnName, fn) {
  if (to.prototype && to.prototype.__addToChain) {
    to.prototype.__addToChain(fnName, fn);
  } else {
    to.__addToChain(fnName, fn);
  }
}

function hasPending(queue) {
  return queue.length >= 1;
}

// c/p from https://github.com/admc/wd/blob/311c39ff2a2a3005405bc5872f420b359a5aa397/lib/utils.js#L108
function niceArgs(args) {
  return JSON.stringify(args)
    .replace(/^\[/, '(')
    .replace(/\]$/, ')');
};
