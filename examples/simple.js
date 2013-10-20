var Basic = require('./basic.js');
var chainit = require('../index.js');
var BasicChain = chainit(Basic);
var b = new BasicChain();
var assert = require('assert');

b
  .concat('I am a basic')
  .add(-10, function() {
    this.concat(' cha')
  })
  .add(20)
  .concat('in', function() {
    assert.equal(this.i, b.i);
    assert.equal(this.i, 10);
    assert.equal(b.s, 'I am a basic chain');
    console.log(b.s, b.i);
  });