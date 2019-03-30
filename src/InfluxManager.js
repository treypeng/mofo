
const Influx = require('influx');

class InfluxManager
{
  constructor(config)
  {
    this.config = config;
    this.influx;
    this.prev = [];
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

  write(frames)
  {
    let points = [];

    for (let f of frames)
    {
      let timestamp = (new Date(Date.parse(f.timestamp))).getTime();

      points.push({
        measurement: this.config.influx.measurement,
        tags: {
          exchange: 'bitmex',
          instrument: String(f.symbol),
        },
        fields: {
          openinterest:   Number(f.openInterest),
          volume:         Number(f.volume),
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

    // console.log(this.prev)

    return num;

  }
}

module.exports = InfluxManager;
