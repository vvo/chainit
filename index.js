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
    queue.lastState = task.state;
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
        if (hasPending(queues[depth - 1])) queues[depth - 1].start();
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
      Chain.prototype[fnName] = makeChain(Constructor.prototype[fnName]);
    });

  function makeChain(fnq, fnn) {

    return function chained() {
      var ctx = this;
      var args = Array.prototype.slice.call(arguments);
      var customCb;

      if (fnq.length <= args.length && typeof args[args.length - 1] === 'function') {
        customCb = args.pop();
      }

      var ldepth = currentDepth;
      var previous = queues[ldepth - 1];
      if (previous && previous.concurrency > 0) {
        previous.concurrency = 0;
      }

      var task = function(cb) { setImmediate(function() {
        currentDepth = ldepth + 1;
        var current = queues[ldepth];
        args.push(function() {
          var cbArgs = arguments,
              err = arguments[0];

          if (customCb) {
            customCb.apply(ctx, cbArgs);
          }
          if (err) {
            if (customCb) current.end();
            else current.error = err;
          }
          setImmediate(cb);
        });
        if (!current.error) {
          try {
            fnq.apply(ctx, args);
          } catch(e) {
            current.error = e;
          }
        }
        if (current.error) {
          var err = current.error;
          if (customCb) {
            current.end();
            customCb.call(ctx, err);
            delete current.error;
          } else {
            if (current.length == current.pending) {
              delete current.error;
              throw err;
            }
          }
          cb();
        }
      }); };

      var queue = queues[ldepth];
      var prevTask = queue && queue.slice(-1).pop();
      var state = prevTask && prevTask.state || queue && queue.lastState || previous && previous.lastState;
      if (fnn) {
        ctx.chainState = state;
        fnn.apply(ctx, args);
        state = ctx.chainState; // fnn can create a new state
      }
      task.state = state;


      pushTo(ldepth, task);

      return this;
    }
  }

  Chain.prototype.__addToChain = function(fnName, fnq, fnn) {
    this[fnName] = makeChain(fnq, fnn);
  }

  return Chain;
}

chainit.add = function add(to, fnName, fnq, fnn) {
  if (to.prototype && to.prototype.__addToChain) {
    to.prototype.__addToChain(fnName, fnq, fnn);
  } else {
    to.__addToChain(fnName, fnq, fnn);
  }
}

function hasPending(queue) {
  return queue.length >= 1;
}
