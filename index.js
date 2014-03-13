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

  /**
   * push chained function into queue
   */
  function pushTo(depth, task) {
    var queue = queues[depth] || (queues[depth] = getNewQueue(depth));

    if (depth > 0) {
      queue.push(task);
      return queue.start();
    }

    // hack to handle cases where first chained calls
    // are not added synchronously
    // it means first chain start will occur after 4ms max
    clearTimeout(flushTimeout);
    process.nextTick(function() {
      flushedTasks.unshift(function() {
        queue.push(task);
        queue.start();
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

  /**
   * initialize new queue as subqueue to API command
   * @param  {Integer} newDepth  queue depth
   */
  function getNewQueue(newDepth) {
    var queue = new Queue({
      timeout: 0,
      concurrency: 1
    });

    queue.on('end', function() {
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
        queues[depth - 1].start();
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

  /**
   * register static methods, not chained
   */
  Object.keys(Constructor)
    .forEach(function(name) {
      Chain[name] = new Function(Constructor[name]);
    });

  /**
   * register prototype methods, chained
   */
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

      if (typeof args[args.length - 1] === 'function') {
        customCb = args.pop();
      }

      var ldepth = currentDepth;

      // if parent queue is running, stop it and run new subquene
      if (currentDepth > 0 && queues[currentDepth - 1].concurrency > 0) {
        queues[currentDepth - 1].concurrency = 0;
      }

      var task = function(cb) {
      process.nextTick(function() {
        currentDepth = ldepth + 1;

        args.push(function() {
          var cbArgs = arguments;

          if (arguments[0] instanceof Error) {
            arguments[0].message = '[' + fnName + niceArgs(callArguments) + '] ' + arguments[0].message;
          }

          // if API provides custom async callback, execute it
          if (customCb) {
            customCb.apply(ctx, cbArgs);
          }

          // call required Queue callback
          cb();
        });

        fn.apply(ctx, args);
      });
      }

      // put async function into queue
      pushTo(currentDepth, task);

      // return this to make API chainable
      // like api.command1().command2()
      return this;
    }
  }

  Chain.prototype.__addToChain = function(fnName, fn) {
    this[fnName] = makeChain(fnName, fn);
  }

  Chain.prototype.__start = function() {

    if(!queues.length || !queues[currentDepth-1]) {
      return false;
    }

    queues[currentDepth-1].start();
  }

  Chain.prototype.__stop = function() {

    if(!queues.length || !queues[currentDepth-1]) {
      return false;
    }

    queues[currentDepth-1].stop();
  }

  return Chain;
}

/**
 * add custom function into chain
 * @param {Object}   to     Context
 * @param {String}   fnName function name
 * @param {Function} fn     function
 */
chainit.add = function add(to, fnName, fn) {
  if (to.prototype && to.prototype.__addToChain) {
    to.prototype.__addToChain(fnName, fn);
  } else {
    to.__addToChain(fnName, fn);
  }
}

/**
 * start chain
 * @param {Object}   to     Context
 */
chainit.start = function start(to) {
  if (to.prototype && to.prototype.__start) {
    to.prototype.__start();
  } else {
    to.__start();
  }
}

/**
 * stop chain
 * @param {Object}   to     Context
 */
chainit.stop = function stop(to) {
  if (to.prototype && to.prototype.__stop) {
    to.prototype.__stop();
  } else {
    to.__stop();
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