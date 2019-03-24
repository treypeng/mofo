
const EventEmitter = require('../event.js');


// pseudo-abstract class, just used a reference really.
class Driver extends EventEmitter
{
  constructor() { super(); }
  ping() { }
}


module.exports = Driver;
