
const assert    = require('assert').strict;
const Driver    = require('./Driver');
const Frame     = require('./Frame');
const WebSocket = require('ws');
const KeepAlive = require('./KeepAlive').BitMEX;
const WS_URI    = 'wss://www.bitmex.com/realtime';
const ID        = 'BITMEX';

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
    this.ws.on('close', () => { this.fire('close');             });

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

    //{"success":true,"subscribe":"tradeBin1m:XBTUSD","request":{"op":"subscribe","args":"tradeBin1m:XBTUSD"}

    // 1. One-time connection msg
    if (res.info)
    {
      this.fire('connected', {info: res.info, limit: res.limit.remaining});
    }

    // 2. Successfully subscribed to a Topic
    else if (res.success)
    {
      // `subscribe` == res.table:row.symbol (below...)
      this.fire(res.subscribe, {status: 'subscribed'});
    }

    // 3. Topic data
    else if (res.data)
    {
      switch(res.table)
      {
        case 'instrument':
          // .data is an array and potentially contains multiple instruments
          // FIXME: make Frame class less stupid and support more than one instr.
          for (let d of res.data)
            this.frame.adopt(ID, d);

          break;

        default:
          break; // ignore
      }
      // console.log(res.data);
      // this.fire(res.table)
      // console.log(this.frame);
      this.fire('frame', {from: ID, data: this.frame.data})
      // if (res.table == 'liquidation') // HACK to show liqs from all instruments
      // {
      //   for (let row of res.data)
      //     this.fire(`${res.table}`, {data: row, time: Date.now()});
      // } else {
      // for (let row of res.data)
      //   this.fire(`${res.table}:${row.symbol}`, {data: row});
      // }
    }

    // 4. Errors
    else if (res.error)
    {
      this.fire('error', res.error);
    }

  }
}

module.exports = BitMEX;
