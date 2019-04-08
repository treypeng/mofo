
const FORMATS = ['json', 'csv'];

                      require('../src/util');
const config        = require('../conf/config');
const InfluxManager = require('../src/InfluxManager');
const CSV           = require('./csv');
const express       = require('express')

const app = express();
const port = config.server.port || 3000;
const csv = new CSV();


app.get('/', (req, res) => res.end('maybe try requesting the correct endpoint doofus'))

// RAW tick data with format
app.get('/:instrument/tick/:from/:to/:fmt', async (req, res) => {

  if (isNaN(req.params.to) || isNaN(req.params.from))
  {
    res.send('Bad format gfy');
    return;
  }

  let format = (req.params.fmt).toLowerCase();

  if (!FORMATS.includes(format))
    format = 'json';

  let data = await _runquery_raw( req.params.instrument, req.params.from, req.params.to );

  if (format == 'json')
  {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));

  } else {

    res.setHeader('Content-Type', 'text/csv');
    res.attachment(`/${data[0].instrument}_[${get_dt_filename()}].csv`);
    res.end(csv.write( data ));

  }

});

// RAW tick data in json only
app.get('/:instrument/tick/:from/:to', async (req, res) => {

  if (isNaN(req.params.to) || isNaN(req.params.from))
  {
    res.send('Bad format gfy');
    return;
  }

  let data = await _runquery_raw( req.params.instrument, req.params.from, req.params.to );

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));

});

// CANDLE data in json
app.get('/:instrument/bucket/:from/:to', async (req, res) => {

  if (isNaN(req.params.to) || isNaN(req.params.from))
  {
    res.send('Bad format gfy');
    return;
  }

  let data = await _runquery_bucket( req.params.instrument, req.params.from, req.params.to );

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));

});

// CANDLE data in any format
app.get('/:instrument/bucket/:from/:to/:fmt', async (req, res) => {

  if (isNaN(req.params.to) || isNaN(req.params.from))
  {
    res.send('Bad format gfy');
    return;
  }

  let format = (req.params.fmt).toLowerCase();

  if (!FORMATS.includes(format))
    format = 'json';

  let data = await _runquery_bucket( req.params.instrument, req.params.from, req.params.to );

  if (format == 'json')
  {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data));

  } else {

    if (!data.length)
    {
        res.end('no data');
        return;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.attachment(`/${data[0].instrument}_OI_1min_[${get_dt_filename()}].csv`);
    res.end(csv.write( data ));

  }

});


async function _runquery_raw(instrument, from, to)
{
  const influxman = new InfluxManager( config );
  await influxman.init();
  return await influxman.readraw(instrument, from, to);
}

async function _runquery_bucket(instrument, from, to)
{
  const influxman = new InfluxManager( config );
  await influxman.init();
  return await influxman.readbucket(instrument, from, to);
}


function get_dt_filename()
{
  let d = new Date(Date.now());
  return `${d.getUTCFullYear()}-` +
         `${String(d.getUTCMonth()+1).padStart(2,'0')}-` +
         `${String(d.getUTCDate()).padStart(2,'0')}_` +
         `${String(d.getUTCHours()).padStart(2,'0')}-` +
         `${String(d.getUTCMinutes()).padStart(2,'0')}-` +
         `${String(d.getUTCSeconds()).padStart(2,'0')}`;
}

app.listen(port, () => console.log(`Exchange data REST service online port=${port}`) )
// const Koa           = require('koa');
//
// const app = new Koa();

//
// // response
// app.use(async (ctx) => {
//   // ctx.body = 'Hello Koa';
//   const influxman = new InfluxManager( config );
//   await influxman.init();
//   let p = await influxman.readraw('XBTUSD', 1553993580000);
//
//   console.log( p.length );
//
// });
//
// app.listen(3000);
