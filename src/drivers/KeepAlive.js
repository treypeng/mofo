

const BITMEX_SLEEP = 5000; //ms
const DERIBIT_HEARTBEAT = 20; // seconds, 10 is minimum, they seem to prefer 30 in their docs

let that;

//
// The way these KeepAlive(s) operate is quite different but I tried to make them
// semi-uniform in the client code
//
// BitMEX: I just ping the server every few seconds (heartbeat supported but cba)
//         using a timer (setInterval)
//
// Deribit: heartbeat required. We give the exchange a timeout and it fires a 'test_request'
//         message prompting us to ping the endpoint: /public/test
//         bit weird tbh but w/e


class BitMEX
{
  constructor(whatever, sleep=BITMEX_SLEEP)
  {
    // .driver is a reference to the BitMEX driver class as a whole
    // which has a ping() method used for keep alive.
    this.driver = whatever;
    this.timer = null;

    that = this;
  }

  start()
  {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.driver.ping();
    }, 5000);
  }

  reset()
  {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;

    this.start();
  }
}



class Deribit
{
  constructor(whatever, sleep=DERIBIT_HEARTBEAT)
  {
    this.ws = whatever;
    this.sleep = sleep;
  }

  start()
  {
    this.ws.send(JSON.stringify({
      jsonrpc : "2.0",
      method : "public/set_heartbeat",
      params : { interval: this.sleep }
    }));
  }

  stop()
  {
    this.ws.send(JSON.stringify({
      jsonrpc : "2.0",
      method : "public/disable_heartbeat",
      params : { }
    }));
  }

  reset(message)
  {
    let p = '';

    // Is this a message we're potentially interested in?
    try { p = message.params.type; } catch { return false; }

    // This is from the Deribit server proving to us that it's alive.
    // Just ignore but tell the calling code we handled it.
    if (p == 'heartbeat') return true;

    // Did deribit ask us to ping a WS verb to prove we're not dead?
    if (p != 'test_request') return false;

    // I believe so. Prove we ent dead by pinging this /test endpoint:
    this.ws.send(JSON.stringify({
      jsonrpc : "2.0",
      method : "public/test",
      params : { }
    }));

    return true;
  }
}

// class YourShittyExchangeHere
//{

//}

module.exports = {BitMEX, Deribit};
