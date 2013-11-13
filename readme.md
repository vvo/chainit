[![Build Status](https://travis-ci.org/vvo/chainit.png)](https://travis-ci.org/vvo/chainit)

# chainit

Turn an asynchronous JavaScript api into an asynchronous
[chainable](http://en.wikipedia.org/wiki/Method_chaining) JavaScript api.

## usage

```js
function MyApi() {}
MyApi.prototype.method1 = function(cb) {cb()}
MyApi.prototype.method2 = function(cb) {cb()}

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

## Overriding methods

You can override methods:
* at the `.prototype` level
* at the instance level

And still benefits from the chain.

You can also keep references to the original methods to set them back later.
This is possible because we do not touch the
`MyApi` original `constructor` nor `prototype`.

```js
function MyApi() {}
MyApi.prototype.method1 = function(cb) {cb()}
MyApi.prototype.method2 = function(cb) {cb()}

var chainit = require('chainit');
var MyChainApi = chainit(MyApi);
var original1 = MyChainApi.prototype.method1;

MyChainApi.prototype.method1 = function(cb) {cb()}

var obj = new MyChainApi();

obj
  .method1() // calls the newly added method1
  .method2();

MyChainApi.prototype.method1 = original1;

obj
  .method1() // calls the original method
  .method2();

original1 = obj.method1;

obj.method1 = function(cb) {cb()}

obj
  .method1() // calls the newly added method1
  .method2();

obj.method1 = original1;
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
* supports methods redifinition
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
