

module.exports = {

  influx: {
    host:           '192.168.1.33', // Need to use host ip with influx docker also with chronograf web interface
    port:           8086,           // Default influx port. Intel x86 nod?
    measurement:    'tick',         // no reason to change this
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

  frequency:      500,           // delta server polling frequency in milliseconds. 500 is good enough.
                                 // typical response from localhost is about 2-4 ms so can be pushed if wanted.
  loglevel: 'debug'

};
