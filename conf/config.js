

module.exports = {

  server: {
    port: 3000
  },

  fileserver: {
    port: 5000,
    path: './static/daily'
  },

  influx: {
    host:           '192.168.1.33', // Need to use host ip with influx docker also with chronograf web interface
    port:           8086,           // Default influx port. Intel x86 nod?
    tickmeasurement:    'tick',         // no reason to change this
    liqmeasurement: 'liq',
    database:       'alphaseries'   // db created automatically if not found

  },

  sources: [
    {
      name: 'bitmex',
      uri: 'http://localhost',
      port: 4444,
      endpoints: [{
        name: 'instrument',
        symbols:['XBTUSD', 'ETHUSD']
      }]
    }
  ],

  frequency:      (1000/5)<<0,           // delta server polling frequency in milliseconds. 500 is good enough.
                                 // typical response from localhost is about 2-4 ms so can be pushed if wanted.
  loglevel: 'info'               // 'error', 'warn', 'info', 'debug' (verbose)

};
