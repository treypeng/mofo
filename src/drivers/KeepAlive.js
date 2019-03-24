

const SLEEP = 5000; //ms
let that;

class KeepAlive
{
  constructor(whatever)
  {
    this.ws = whatever;
    this.timer = null;

    that = this;
  }

  start()
  {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.ws.ping();
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


module.exports = KeepAlive;
