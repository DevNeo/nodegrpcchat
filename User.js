//User class.

var Dequeue = require('dequeue')
module.exports = {
Person: function(name, pass){
  this.name = name;
  this.pass = pass;
  this.dequeue = new Dequeue();
}
}