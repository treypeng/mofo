//docker exec -it mofo_influxdb_1 influx
const keypress = require('keypress');
const BitMEX = require('./src/drivers/BitMEX');
const Deribit = require('./src/drivers/Deribit');
const Influx = require('influx');

const I_MEASUREMENT   = 'tick'
const I_DB            = 'xdata';

let dr = new Deribit();
let bm = new BitMEX();

const influx = new Influx.InfluxDB({
 host: 'localhost',
 database: I_DB,
 schema: [
   {
     measurement: I_MEASUREMENT,
     fields: {
       openinterest:  Influx.FieldType.FLOAT,
       volume:        Influx.FieldType.FLOAT,
       fundingrate:   Influx.FieldType.FLOAT,
       mark:          Influx.FieldType.FLOAT,
       bid:           Influx.FieldType.FLOAT,
       ask:           Influx.FieldType.FLOAT
     },
     tags: [
       'exchange',
       'instrument'
     ]
   }
 ]
});

dr.start();
bm.start();

dr.on( 'connected', c => console.log( c ) );
dr.on( 'frame', frame );

bm.on( 'connected', c => console.log(c) );
bm.on( 'frame', frame );

function frame(d)
{
  console.log(`${d.from}:${d.data.instrument} mark=${d.data.markprice}, vol=${d.data.volume}, oi=${d.data.openinterest}`);

  influx.writePoints([
    {
      measurement: I_MEASUREMENT,
      tags: {
        exchange: d.from,
        instrument: d.data.instrument,
      },
      fields: {
        openinterest: d.data.openinterest,
        volume: d.data.volume,
        fundingrate: d.data.fundingrate,
        mark: d.data.markprice,
        bid: d.data.bidprice,
        ask: d.data.askprice
      },
      timestamp: d.from.timestamp,
      precision: 'ms'
    }
  ]).then(() => {
    console.log('=> Inserted');
  }).catch(error => {
    console.error(`Error saving data to InfluxDB! ${error.stack}`)
  });

}


keypress(process.stdin);
process.stdin.setRawMode(true);
process.stdin.resume();


process.stdin.on('keypress', (ch, key) => {

  if (key && key.name == 'escape')
  {
    console.log('Shutdown...');
    if (bm) bm.stop();
    if (dr) dr.stop();

    bm.on('close', () => { console.log('BitMEX disconnected OK.'); bm = null; if (!dr) process.exit(0); });
    dr.on('close', () => { console.log('Deribit disconnected OK.'); dr = null; if (!bm) process.exit(0); });
  }

});
