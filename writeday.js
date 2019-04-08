
                      require('./src/util');
const InfluxManager = require('./src/InfluxManager');
const config        = require('./conf/config');
const CSV           = require('./rest/csv');
const fs            = require('fs');
const path          = require('path');

const INSTR = ['XBTUSD', 'ETHUSD'];

const DAY_MS = 1000 * 60 * 60 * 24;

// L.info( `Connecting to Influx ${config.influx.host}:${config.influx.port}` );

async function _runquery_tick(from, to)
{
  const influxman = new InfluxManager( config );
  await influxman.init();
  let results = [];

  for (let i of INSTR)
    results.push({instrument: i, data: await influxman.readraw( i, from, to ) });

  return results;
}

 (async function(){

  let now = Date.now();
  let today_open = process.argv[2] ? Number(process.argv[2]) + DAY_MS : (now - (now % DAY_MS));
  let yesterday_close =  today_open - 1; // 1 millisecond so 23:59:59.999
  let yesterday_open = today_open - DAY_MS;

  console.log(`Using daily open: ${get_dt_filename(yesterday_open)}`);

  let res = await _runquery_tick(yesterday_open, yesterday_close);

  let csv = new CSV();

  let filepart = get_dt_filename(yesterday_open);

  for (let i of res)
  {
    let lines = csv.write( i.data );
    let filename = `${filepart}_tick_${i.instrument}.csv`;
    let outpath = path.join(__dirname, config.fileserver.path, i.instrument, filename);

    fs.writeFileSync(outpath, lines);

    console.log(`Wrote '${outpath}' (${i.data.length} ticks)`);

  }
 })();


 function get_dt_filename(yesterday_open)
 {
   let d = new Date(yesterday_open);
   return `${d.getUTCFullYear()}-` +
          `${String(d.getUTCMonth()+1).padStart(2,'0')}-` +
          `${String(d.getUTCDate()).padStart(2,'0')}`;
 }
