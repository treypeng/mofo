
                      require('./src/util');
const InfluxManager = require('./src/InfluxManager');
const config        = require('./conf/config');

const INSTR = ['XBTUSD', 'ETHUSD'];

const DAY_MS = 1000 * 60 * 60 * 24;

// L.info( `Connecting to Influx ${config.influx.host}:${config.influx.port}` );

async function _runquery_tick()
{
  const influxman = new InfluxManager( config );
  await influxman.init();
  let results = [];

  let now = Date.now()
  let today_open = now - (now % DAY_MS);
  today_open += DAY_MS;
  let yesterday_close =  today_open - 1; // 1 millisecond so 23:59:59.999
  let yesterday_open = today_open - DAY_MS;

  for (let i of INSTR)
    results.push({instrument: i, data: await influxman.readraw(i, yesterday_open, yesterday_close) })

  return results;
}


 (async function(){
    let res = await _runquery_tick();
    console.log(res[0].data);
 })();
