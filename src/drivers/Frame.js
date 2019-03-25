
const assert    = require('assert').strict;

/*
    All statistics gathered in (what I call) a 'frame' of data
    this isn't time-quantised, is the latest of an irregular time series
    emitted by the exchange. As exchange emits deltas, likely that not all
    fields were updated so just clamp their current values;

*/

class Frame
{
  constructor()
  {
    this._d = {
        instrument: '',
        timestamp : '',  // ms epoch
        openinterest : 0,
        volume : 0,
        fundingrate : 0,
        markprice : 0,
        bidprice : 0,
        askprice : 0
      };
  }

  get data() { return this._d; }

  adopt(exchange, data)
  {
    let timestamp = 0;

    // Clone the existing data object to see if it actually changed
    let clone = Object.assign({}, this._d);

    delete clone.timestamp;

    // Assume there is fresh data somewhere and assign it all
    switch(exchange)
    {
      case 'bitmex':
        timestamp = (new Date(Date.parse(data['timestamp']))).getTime();
        this._d.openinterest   = data['openInterest']  || this._d.openinterest;
        this._d.volume         = data['volume']        || this._d.volume;
        this._d.fundingrate    = data['fundingRate']   || this._d.fundingrate;
        this._d.markprice      = data['markPrice']     || this._d.markprice;
        this._d.bidprice       = data['bidPrice']      || this._d.bidprice;
        this._d.askprice       = data['askPrice']      || this._d.askprice;
        this._d.instrument     = data['symbol'];

        break;

      case 'deribit':
        timestamp              = data['timestamp'];
        this._d.openinterest   = data['open_interest']    || this._d.openinterest;
        this._d.volume         = data['stats']['volume']  || this._d.volume;
        this._d.fundingrate    = data['current_funding']  || this._d.fundingrate;
        this._d.markprice      = data['mark_price']       || this._d.markprice;
        this._d.bidprice       = data['best_bid_price']   || this._d.bidprice;
        this._d.askprice       = data['best_ask_price']   || this._d.askprice;
        this._d.instrument     = data['instrument_name'];
        break;

      default:
        assert.ok(false, 'Exchange not implemented - aborting.');
        break;
    }

    // Was anything actually changed?

    let changed = false;

    for (let key in clone)
    {
      if (clone[key] != this._d[key])
      {
        clone.timestamp = timestamp;
        changed = true;
        break;
      }
    }

    // assign the correct timestamp if something was changed
    if (changed)
    {
      // console.log(data);
      this._d.timestamp = timestamp;
    }

    return changed;
  }
}

module.exports = Frame;
