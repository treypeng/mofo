
const Influx = require('influx');

class InfluxManager
{
  constructor(config)
  {
    this.config = config;
  }

  async init()
  {

    L.debug(`Writing to InfluxDB ${this.config.influx.database}:'${this.config.influx.measurement}'`);

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
           totalvolume:   Influx.FieldType.FLOAT,
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
          totalvolume:    Number(f.totalVolume),
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
    }).catch(error => {
      L.error(`Error saving data to InfluxDB! ${error.stack}`)
    });
  }
}

module.exports = InfluxManager;
