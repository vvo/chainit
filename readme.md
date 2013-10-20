# chainit

Turn an asynchronous JavaScript api into an asynchronous
[chainable](http://en.wikipedia.org/wiki/Method_chaining) JavaScript api.

Features:

* supports async apis
* supports nested calls
* preserve nested calls order
* preserve context in callbacks
* preserve callback arguments

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
  .method1() // 1
  .method2() // 2
  .method1(function(/* args */) { // 3
    this.method1(); // 4
  })
  .method2(); // 5
```

Call order:

1. method1
2. method2
3. method1
4. method1
5. method2

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
