

// 'Mofo' @treypeng. Couldn't think of a better name.

// Edit conf/config.js as needed then:
// node mofo

// docker exec -it stack_influxdb_1 influx
// if you wanna connect to the db
// the run query `USE alphaseries` and then `SELECT * FROM tick` if you wanna see data
// usual sql rules apply see Influx docs for more

const keypress      = require('keypress');
const fetch         = require('node-fetch');

const InfluxManager = require('./src/InfluxManager');
const Logger        = require('./src/logger');
const config        = require('./conf/config');

// global (gfy)
L = new Logger(config.loglevel || 'warn');

L.info(`Connecting to Influx ${config.influx.host}:${config.influx.port}`);

// Open create database ready for writing
const influxman = new InfluxManager(config);
let timer = null;

// Entry point
(async () => {

  influxman.init();
  // show it in Hertz cos i'm a diiiick
  L.info(`Connected. Polling @ ${(1000 / config.frequency).toFixed(2)}Hz.`);

  timer = setInterval(frame, config.frequency);

})();

// Multiple sources possible. For each of these there would be a delta server
// This doesn't exist for Deribit etc and would need to be written (not too taxing unles managing the order book)
// Just pick the first one for now which should be mex
let mex = config.sources[0];

async function frame()
{
  let frames = [];

  // Each endpoint is an aspect of the mex api we're interested in.
  // e.g. instrument ticker, or L2 order book etc.
  for (let ep of mex.endpoints)
  {
    for (let sym of ep.symbols)
    {
      // Just fire these iteratively for now
      let res = await fetch(`${mex.uri}:${mex.port}/${ep.name}?symbol=${sym}`);

      // mex api always returns array even for single request
      let data = (await res.json())[0];

      frames.push(data);

      L.debug(`${data.symbol}\tlast=${data.lastPrice}\tmark=${data.markPrice}\toi=${(data.openInterest/1000000).toFixed(3)} M`);
    }
  }

  // Write array of 'frames'. Each frame contains the fields we are interested in (price, open interest etc)
  influxman.write(frames);
}

// Press escape to quit if running -ti in docker. If not... find some other way.
keypress(process.stdin);
if (process.stdin.setRawMode)
  process.stdin.setRawMode(true);
process.stdin.resume();


process.stdin.on('keypress', (ch, key) => {

  if (key && key.name == 'escape')
  {
    L.warn('Shutdown...');
    // clean up nicely because professional
    clearInterval(timer);
    process.exit(0);
  }

});
