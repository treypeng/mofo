

// 'Mofo' @treypeng. Couldn't think of a better name.

// Edit the two configs as needed then
// node mofo
// see README.md for more

// docker exec -it stack_influxdb_1 influx
// if you wanna connect to the db
// the run query `USE alphaseries` and then `SELECT * FROM tick` if you wanna see data
// usual sql rules apply see Influx docs for more


const keypress      = require('keypress');
const fetch         = require('node-fetch');

                      require('./src/util');
const InfluxManager = require('./src/InfluxManager');
const config        = require('./conf/config');

L.info( `Connecting to Influx ${config.influx.host}:${config.influx.port}` );

// Open create database ready for writing
const influxman = new InfluxManager( config );
let timer = null;


// Entry point
(async () => {

  try {

    await influxman.init();
    L.info( `Connected. Polling @ ${( 1000 / config.frequency ).toFixed(2)}Hz.` );
    L.print( `> Press [ESC] to terminate` );
    timer = setInterval( frame, config.frequency );

  } catch(error) {

    L.error( `Fatal: Error initialising Influx. Is the docker service running? Aborting.` );
    L.error( ` ** Sometimes stack is slow to boot. Try again in 5-10 seconds. ** ` );
    process.exit( 1 );

  }


})();

// Multiple sources possible. For each of these there would be a delta server
// This doesn't exist for Deribit etc and would need to be written (not too taxing unles managing the order book)
// Just pick the first one for now which should be mex
let mex = config.sources[0];
let totalwritten = 0;

async function frame()
{
  let frames = [];

  // Each endpoint is an aspect of the mex api we're interested in.
  // e.g. instrument ticker, or L2 order book etc.
  for (let ep of mex.endpoints)
  {
    for (let sym of ep.symbols)
    {
      let res = null, data;

      // Just fire these iteratively for now
      try {

        res = await fetch( `${mex.uri}:${mex.port}/${ep.name}?symbol=${sym}` );
        data = (await res.json())[0];

      } catch ( error ) {

        L.error( `Error polling delta server. Is the docker service running?` );
        res = null;

      }

      // attach some info to help influx manager
      data.uid = `${mex.name}:${ep.name}:${sym}`;

      // assume temporary glitch
      if (!res) continue;

      // mex api always returns array even for single request
      frames.push( data );

      L.debug( `${data.symbol}\tlast=${data.lastPrice}\tmark=${data.markPrice}` +
                `\toi=${(data.openInterest/1000000).toFixed(3)} M` );
    }
  }

  let num = 0;

  // Write array of 'frames'. Each frame contains the fields we are interested in (price, open interest etc)
  try {  num = influxman.write( frames ) } catch ( error ) {
    L.error( `Error writing to Influx. Is the docker service running?` );
    L.error(error);
  }

  totalwritten += num;
  let tp = totalwritten > 1500 ? (totalwritten/1000).toFixed(1) + 'k' : totalwritten;
  process.stdout.write(`\r  Written ${tp} total ticks.\t`);

}

// Press escape to quit if running -ti in docker. If not... find some other way.
keypress( process.stdin );
if ( process.stdin.setRawMode )
  process.stdin.setRawMode( true );
process.stdin.resume();


process.stdin.on( 'keypress', (ch, key) => {

  if (key && key.name == 'escape')
  {
    console.log();
    L.warn('Shutdown...');

    // clean up nicely because professional
    clearInterval( timer );
    process.exit(0);
  }

});
