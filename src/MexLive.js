
const WebSocket = require('ws');
const EventEmitter = require('./event.js');
const KeepAlive = require('./KeepAlive');

var that;

class MexLive extends EventEmitter
{
  constructor()
  {
    super();
    that = this;
    this.ready = false;
    this.subscriptions = [];

  }

  connect(url)
  {
    this.ws = new WebSocket(url);

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
    // poke the server in the balls
    if (this.ready)
      this.ws.send(`"ping"`);
  }

  _handle_messages(res)
  {
    this.keepalive.reset();

    if (res == 'pong')
      return;

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
      if (res.table == 'liquidation') // HACK to show liqs from all instruments
      {
        for (let row of res.data)
          this.fire(`${res.table}`, {data: row, time: Date.now()});
      } else {
        for (let row of res.data)
          this.fire(`${res.table}:${row.symbol}`, {data: row});
      }
    }

    // 4. Errors
    else if (res.error)
    {
      this.fire('error', res.error);
    }

  }

  subscribe(topicfilter)
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
    if (!this.ready) return;

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
}


module.exports = MexLive;
