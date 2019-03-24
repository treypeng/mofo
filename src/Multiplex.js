
const EventEmitter = require('./event.js');

/*
    Bunch data emitted from exchange drivers and push to Influx series
*/

class Multiplex extends EventEmitter
{
  constructor()
  {
    super();
  }
}
