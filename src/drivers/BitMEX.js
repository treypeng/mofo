
const assert    = require('assert').strict;
const Driver    = require('./Driver');
const Frame     = require('./Frame');
const WebSocket = require('ws');
const KeepAlive = require('./KeepAlive').BitMEX;
const WS_URI    = 'wss://www.bitmex.com/realtime';
const ID        = 'bitmex';

/*
    Connects
*/

class BitMEX extends Driver
{
  constructor()
  {
    super();
    this.ready = false;
    this.subscriptions = [];
    this.frame = new Frame();

    // Obviously this can be extended outside the class in future if needed.
    this._subscribe('instrument:XBTUSD');
  }

  start()
  {
    this.ws = new WebSocket(WS_URI);

    this.ws.on('open', ()  => {
      this.ready = true;
      this._sub();
      this.keepalive = new KeepAlive(this);
      this.keepalive.start();
    });

    this.ws.on('message',       this._handle_messages.bind(this) );
    this.ws.on('close', () => { this.fire('close', {info: `${ID}: Goodbye`}); });

  }

  ping()
  {
    if (this.ready)
      this.ws.send('ping');
    console.log(` => ping`)
  }

  _subscribe(topicfilter)
  {
    this.subscriptions.push({topicfilter, subscribed: false});
    this._sub();
  }

  stop(cb=null)
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
          op: `subscribe`,
          args: s.topicfilter
        });

        s.subscribed = true;
        this.ws.send(sub);
      }
    }
  }


  _handle_messages(res)
  {
    assert.ok(this.keepalive, 'No keepalive. Impossible situation - aborting')

    this.keepalive.reset();

    if (res == 'pong')
    {
      console.log(` <= pong!`)
      return;
    }

    res = JSON.parse(res);

    let newframe = false;

    // one-time connect message
    if (res.info)
      this.fire('connected', {info: res.info, limit: res.limit.remaining});

    // Successfully subscribed to a Topic
    else if (res.success)
    {
      // `subscribe` == res.table:row.symbol (below...)
      this.fire(res.subscribe, {status: 'subscribed'});
    }

    // Topic data
    else if (res.data)
    {
      switch(res.table)
      {
        case 'instrument':
          // .data is an array and potentially contains multiple instruments
          // FIXME: make Frame class less stupid and support more than one instr.
          // for (let d of res.data)

          newframe = this.frame.adopt(ID, res.data[0]);

          break;

        default:
          break; // ignore
      }

      if (newframe)
        this.fire('frame', {from: ID, data: this.frame.data})

    }

    // 4. Errors
    else if (res.error)
    {
      this.fire('error', res.error);
    }

  }
}

module.exports = BitMEX;
