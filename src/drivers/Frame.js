
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
        timestr : '',
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
    switch(exchange)
    {
      case 'BITMEX':
        this._d.timestr        = data['timestamp']     || this._d.timestr;
        this._d.openinterest   = data['openInterest']  || this._d.openinterest;
        this._d.volume         = data['volume']        || this._d.volume;
        this._d.fundingrate    = data['fundingRate']   || this._d.fundingrate;
        this._d.markprice      = data['markPrice']     || this._d.markprice;
        this._d.bidprice       = data['bidPrice']      || this._d.bidprice;
        this._d.askprice       = data['askPrice']      || this._d.askprice;
        break;

      case 'DERIBIT':      
        this._d.timestr        = (new Date(data['timestamp'])).toISOString() || this._d.timestr;
        this._d.openinterest   = data['open_interest']    || this._d.openinterest;
        this._d.volume         = data['stats']['volume']  || this._d.volume;
        this._d.fundingrate    = data['current_funding']  || this._d.fundingrate;
        this._d.markprice      = data['mark_price']       || this._d.markprice;
        this._d.bidprice       = data['best_bid_price']   || this._d.bidprice;
        this._d.askprice       = data['best_ask_price']   || this._d.askprice;
        break;

      default:
        assert.ok(false, 'Exchange not implemented - aborting.');
        break;
    }

    return this._d;
  }
}

module.exports = Frame;
