
const Influx = require('influx');

const DAY_MS = 1000*60*60*24;

class InfluxManager
{
  constructor(config)
  {
    this.config = config;
    this.influx;
    this.prev = [];
    this.vdelta = {};
  }

  async init()
  {

    L.debug(`Writing to InfluxDB ${this.config.influx.database}:'${this.config.influx.measurement}'`);

    // This should throw an error if influx not running. But doens't. :thonking:
    this.influx = new Influx.InfluxDB({
     host: this.config.influx.host,
     port: this.config.influx.port,
     database: this.config.influx.database,
     schema: [
       {
         measurement: this.config.influx.measurement,
         fields: {
           openinterest:  Influx.FieldType.FLOAT,
           volume:        Influx.FieldType.FLOAT,
           volume24:      Influx.FieldType.FLOAT,
           vwap:          Influx.FieldType.FLOAT,
           fundingrate:   Influx.FieldType.FLOAT,
           last:          Influx.FieldType.FLOAT,
           fair:          Influx.FieldType.FLOAT,
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

    // lolwut? You have to create a database ... a-a-after opening it? excusemewtf
    // why isn't this a static method? feels hacky af, try harder API nerds.
    let names = await this.influx.getDatabaseNames();

    if (!names.includes(this.config.influx.database))
      this.influx.createDatabase(this.config.influx.database);

  }


  // unbucketed
  async readraw(instrument, from=null, to=null)
  {
    // Both params blank = last 24 hours
    let now = Date.now();
    to = to || now;
    from = from || to - DAY_MS;

    // if user requests data in future, influx will try to supply it cos idk
    to = Math.min(to, now);

    return await this.influx.query(`
             select * from tick
             where instrument = ${Influx.escape.stringLit(instrument)}
             and time >= ${from}000000 and time <= ${to}000000
             order by time asc limit 100000`);

  }

  async readbucket(instrument, from=null, to=null)
  {
    to = to || Date.now();
    from = from || to - DAY_MS;

    return await this.influx.query(`
             select first(openinterest) as open, max(openinterest) as high, min(openinterest) as low, last(openinterest) as close
             from tick
             where instrument = ${Influx.escape.stringLit(instrument)}
             and time >= ${from}000000 and time <= ${to}000000
             GROUP by time(1m), instrument, exchange FILL(linear)`);

/*
SELECT
first(price) AS open,
last(price) AS close,
max(price) AS high,
min(price) AS low,
sum(amount) AS volume
FROM trades
WHERE exchange='binance' AND pair='btcusdt' AND time > 1525777200000ms and time < 1525831200000ms
GROUP BY time(1h), pair, exchange
*/
  }

  write(frames)
  {

    let points = [];

    for (let f of frames)
    {
      this.vdelta[f.uid] = this.vdelta[f.uid] || { t: 0, v: 0 };

      // Firstly, check that this unique symbol has actually received
      // new information by comparing timestamp
      let timestamp = (new Date(Date.parse( f.timestamp ))).getTime();
      if (timestamp <= this.vdelta[f.uid].t) continue;

      //subtract current cumulative volume from last tick's cum volume to get interval vol.
      let deltavol = Math.max( 0, f.volume - (this.vdelta[f.uid].v || f.volume ));

      points.push({
        measurement: this.config.influx.measurement,
        tags: {
          exchange: 'bitmex',
          instrument: String(f.symbol),
        },
        fields: {
          openinterest:   Number(f.openInterest),
          volume:         Number(deltavol),
          volume24:       Number(f.volume24h),
          vwap:           Number(f.vwap),
          fundingrate:    Number(f.fundingRate),
          last:           Number(f.lastPrice),
          fair:           Number(f.fairPrice),
          mark:           Number(f.markPrice),
          bid:            Number(f.bidPrice),
          ask:            Number(f.askPrice)
        },
        timestamp: timestamp
      });

      this.vdelta[f.uid] = { t: timestamp, v: f.volume }
    }




    this.influx.writePoints(points, { precision: 'ms' }).then(() => {
      // console.log('=> Inserted');
      L.debug('Inserted OK');
    }).catch(error => {
      L.error(`Error saving data to InfluxDB! Is the docker service running?`);
    });

    let num = 0, tmp = [];
    for (let p of points)
    {
      let uid = `${p.timestamp}:${p.tags.instrument}`;
      if (!this.prev.includes(String(uid)))
      {
        tmp.push(uid);
        num++;
      }
    }

    this.prev = this.prev.concat(tmp);
    this.prev = this.prev.slice(-10);

    return num;

  }
}

module.exports = InfluxManager;
