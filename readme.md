[![browser support](https://ci.testling.com/vvo/chainit.png)](https://ci.testling.com/vvo/chainit)

# chainit

Turn an asynchronous JavaScript api into an asynchronous
[chainable](http://en.wikipedia.org/wiki/Method_chaining) JavaScript api.

## usage

```js
function MyApi() {
  // ...
}

MyApi.prototype.method1 = function(cb) {
  // ...
}

MyApi.prototype.method2 = function(cb) {
  // ...
}

var chainit = require('chainit');
var MyChainApi = chainit(MyApi);
var obj = new MyChainApi();
obj
  .method1()                      // 1st call
  .method2()                      // 2nd call
  .method1(function(/* args */) { // 3rd call
    this.method1();               // 4th call
  })
  .method2();                     // 5th call
```

## features

Features:

* supports async apis
* supports (crazy) nested calls
* preserve nested calls order
* preserve context in cb()
* preserve cb(args)
* supports process.nextTick(cb)
* supports setTimeout(cb)
* fully tested! `npm test`

## examples

See [examples](examples/).

## tests

See [tests](test/).

```shell
npm test
```

## async/sync apis

There is no easy way to mix sync/async chainable
apis because there is no way to differenciate sync/async calls.

```js
obj
  .asyncMethod()
  .syncMethod()
```

We cannot know that syncMethod is synchronous and that
we do not
need to wait for a callback to be called to continue.

Either your api is fully asynchronous and every method
takes a callback.

Either your api is fully synchronous.
If you want synchronous support, make a pull request
adding `chainit.sync(Constructor)`.

## credits

This module was done easily thanks to
[jessetane/queue](https://github.com/jessetane/queue).

A chainable api is just queueing methods and reordering calls.

This module was built to replace the chainable api from
[webdriverjs](https://github.com/camme/webdriverjs/tree/v0.8.0).
