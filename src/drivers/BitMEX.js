
const Driver    = require('./Driver');
const WebSocket = require('ws');
const KeepAlive = require('./KeepAlive');
const WS_URI    = 'wss://www.bitmex.com/realtime';

class BitMEX extends Driver
{
  constructor()
  {
    super();
    this.ready = false;
    this.subscriptions = [];

    // Obviously this can be extended outside the class in future if needed.
    this._subscribe('instrument');
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

  ping()
  {
    this.ws.end('ping');
  }


}
