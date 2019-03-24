
const assert    = require('assert').strict;
const Driver    = require('./Driver');
const Frame     = require('./Frame');
const WebSocket = require('ws');
const KeepAlive = require('./KeepAlive').Deribit;
const WS_URI    = 'wss://test.deribit.com/ws/api/v2/';
const ID        = 'DERIBIT';

const BASE_ACTION = '/api/v2/public/';

/*
    Connects
*/

class Deribit extends Driver
{
  constructor()
  {
    super();
    this.ready = false;
    this.subscriptions = [];
    this.frame = new Frame();

    // Obviously this can be extended outside the class in future if needed.
    // this._subscribe('instrument:XBTUSD');
    this._subscribe( 'ticker.BTC-PERPETUAL.raw' );
  }

  start()
  {
    this.ws = new WebSocket(WS_URI);

    this.ws.on('open', ()  => {
      this.ready = true;
      this._sub();
      this.keepalive = new KeepAlive(this.ws);
      // this.keepalive.start.apply(this.keepalive);
      this.keepalive.start();//).bind(this.keepalive);
      this.fire('connected', {success:true});
    });

    this.ws.on('message',       this._handle_messages.bind(this) );
    this.ws.on('close', () => { this.fire('close');             });

  }

  ping()
  {
    if (this.ready)
      this.ws.send(JSON.stringify({
        jsonrpc : "2.0",
        method : "public/test",
        params : { }
      }));

    console.log(` => test (ping)`)
  }

  _subscribe(args)
  {
    this.subscriptions.push({method: 'public/subscribe', params: {channels: [args]}, subscribed: false});
    this._sub();
  }

  close()
  {
    this.ws.close();
  }

  _sub()
  {
    // Socket not open, abort
    if (!this.ready)
      return;

    // Lazy-load subscriptions
    for (let s of this.subscriptions)
    {
      if (!s.subscribed)
      {
        let sub = JSON.stringify({
          jsonrpc: '2.0',
          method: s.method,
          params: s.params
        });
        s.subscribed = true;
        this.ws.send(sub);
      }
    }
  }


  _handle_messages(res)
  {
    res = JSON.parse(res);

    assert.ok(this.keepalive, 'No keepalive. Impossible situation - aborting')

    // Check for any heartbeat signals and respond, otherwise continue
    if (this.keepalive.reset(res))
      return;

    // Report any errors immediately
    if (res.error)
    {
      this.fire('error', res.error);
      return;
    }

    // Dunno what this message is, let's ignore it
    if (!res.params)
      return;

    // Do we have a message about a channel?
    if (res.params.channel)
    {
      // `channel` e.g. "ticker.BTC-PERPETUAL.raw" ... really stupid unfriendly format thanks guys
      switch(res.params.channel.split('.')[0])
      {
        case 'ticker':
            // Parse the data and attach to our delta-friendly Frame object
            this.frame.adopt(ID, res.params.data);
          break;

        default:
          break; // ignore
      }

      // Tell client/multiplexer there's fresh data to get fresh with
      this.fire('frame', {from: ID, data: this.frame.data})

   } else  {
     console.log(`Unexpected message from Deribit:`);
     console.log(res.params);
    }

  }
}


module.exports = Deribit;
