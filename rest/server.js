
const FORMATS = ['json', 'csv'];

                      require('../src/util');
const config        = require('../conf/config');
const InfluxManager = require('../src/InfluxManager');
const CSV           = require('./csv');
const express       = require('express')

const app = express();
const port = config.server.port || 3000;
const csv = new CSV();



app.get('/', (req, res) => res.send('maybe try requesting the correct endpoint doofus'))

app.get('/:instrument/:from/:to/:fmt', async (req, res) => {

  if (isNaN(req.params.to) || isNaN(req.params.from))
  {
    res.send('Bad format gfy');
    return;
  }

  let format = (req.params.fmt).toLowerCase();

  if (!FORMATS.includes(format))
    format = 'json';

  let data = await _runquery( req.params.instrument, req.params.from, req.params.to );

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

app.get('/:instrument/:from/:to', async (req, res) => {

  if (isNaN(req.params.to) || isNaN(req.params.from))
  {
    res.send('Bad format gfy');
    return;
  }

  let data = await _runquery( req.params.instrument, req.params.from, req.params.to );

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));

});


async function _runquery(instrument, from, to)
{
  const influxman = new InfluxManager( config );
  await influxman.init();
  return await influxman.readraw(instrument, from, to);

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

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
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
