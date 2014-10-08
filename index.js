module.exports = chainit;

function chainit(Constructor) {

  function Chain() {
    Constructor.apply(this, arguments);
  }

  Chain.prototype = Object.create(Constructor.prototype);

  var Queue = require('queue');
  var queues = [];
  var currentDepth = 0;

  function pushTo(depth, task) {
    var queue = queues[depth] || (queues[depth] = getNewQueue(depth));
    queue.push(task);
    setImmediate(function() {
      if (!queue.running) queue.start();
    });
  }

  function getNewQueue(newDepth) {
    var queue = Queue({
      timeout: 0,
      concurrency: 1
    });

    queue.on('end', function(err) {
      if (newDepth > 0) {
        wakeupChain(newDepth);
      }
      if (!queues.slice(newDepth).some(hasPending)) {
        currentDepth = newDepth;
      }
    });

    function wakeupChain(depth) {
      if (!queues[depth + 1] || !queues.slice(depth).some(hasPending)) {
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
      var args = Array.prototype.slice.call(arguments);
      var customCb;

      if(typeof args[args.length - 1] === 'function') {
        customCb = args.pop();
      }

      var ldepth = currentDepth;
      var previous = queues[ldepth - 1];
      if (previous && previous.concurrency > 0) {
        previous.concurrency = 0;
      }

      var task = function(cb) { setImmediate(function() {
        currentDepth = ldepth + 1;
        args.push(function() {
          var cbArgs = arguments,
              err = arguments[0];

          if (err) {
            // flush the current queue
            queues[ldepth].end();
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
      }); };
      pushTo(ldepth, task);

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
