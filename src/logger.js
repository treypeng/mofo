
// my own logger cos everything else on npm is shit

const cc = {
        Reset : "\x1b[0m",
        Bright : "\x1b[1m",
        Dim : "\x1b[2m",
        Underscore : "\x1b[4m",
        Blink : "\x1b[5m",
        Reverse : "\x1b[7m",
        Hidden : "\x1b[8m",

        FgBlack : "\x1b[30m",
        FgRed : "\x1b[31m",
        FgGreen : "\x1b[32m",
        FgYellow : "\x1b[33m",
        FgBlue : "\x1b[34m",
        FgMagenta : "\x1b[35m",
        FgCyan : "\x1b[36m",
        FgWhite : "\x1b[37m",

        BgBlack : "\x1b[40m",
        BgRed : "\x1b[41m",
        BgGreen : "\x1b[42m",
        BgYellow : "\x1b[43m",
        BgBlue : "\x1b[44m",
        BgMagenta : "\x1b[45m",
        BgCyan : "\x1b[46m",
        BgWhite : "\x1b[47m"
};


const HISTORY_FLUSH = 100; // save copy of last 100 messages

const LEVELS = {};

LEVELS['print'] = {id: 0, icon: '', col:cc['Reset']};
LEVELS['error'] = {id: 1, icon: '💣 ', col:`${cc['BgRed']}${cc['FgWhite']}`} ;
LEVELS['warn'] = {id: 2, icon: '⚠️ ', col:cc['FgYellow']};
LEVELS['info'] = {id: 3, icon: 'ℹ️ ', col:cc['FgCyan']};
LEVELS['debug'] = {id: 4, icon: '⚛️ ', col:`${cc['FgWhite']}`};


//TODO: add something to concatenate when more than one parameter (string) passed
// caught me out more than once!

module.exports = class Logger
{
  constructor(level)
  {
    this._disable = false;
    this.level = LEVELS[level || 'error'];
    this.history = [];
  }

  // just some helper funcs, format ms timestamp to UTC YYYY-MM-DD
  d(unix_time)
  {
    let d = new Date(unix_time);
    return `${d.getUTCFullYear()}-` +
           `${String(d.getUTCMonth()+1).padStart(2,'0')}-` +
           `${String(d.getUTCDate()).padStart(2,'0')}`;
  }

  // same as above but with hh:mm:ss
  dt(unix_time)
  {
    let d = new Date(unix_time);
    return `${d.getUTCFullYear()}-` +
           `${String(d.getUTCMonth()+1).padStart(2,'0')}-` +
           `${String(d.getUTCDate()).padStart(2,'0')} ` +
           `${String(d.getUTCHours()).padStart(2,'0')}:` +
           `${String(d.getUTCMinutes()).padStart(2,'0')}:` +
           `${String(d.getUTCSeconds()).padStart(2,'0')}`;
  }

  // "2019-03-29T02:45:09.195Z"  => 1553827519857 unix epoch
  ms(iso_string)
  {
    return (new Date(Date.parse(iso_string))).getTime();
  }


  set(level='warn')
  {
    this._disable = false;
    this.level = LEVELS[level];
  }

  disable(state=true)
  {
    this._disable = state;
  }

  print(...args)
  {
    if (this._disable) return;
    console.log(...args);
  }

  log(level, message)
  {
    if (this._disable) return;

    let n;
    if (!message)
    {
      message = level;
      n = this.level;
    } else {
      n = LEVELS[level];
    }

    this.history.push({id: n.id, message});
    this.history = this.history.slice(-HISTORY_FLUSH);

    if ( n.id <= this.level.id )
      console.log(`${cc['Bright']}${n.col}${n.icon} ${message}${cc['Reset']}`);

  }

  // lazy alias methods
  error(msg)  { if (this._disable) return; this.log('error', msg ); }
  warn(msg)   { if (this._disable) return; this.log('warn', msg );  }
  info(msg)   { if (this._disable) return; this.log('info', msg );  }
  debug(msg)  { if (this._disable) return; this.log('debug', msg);  }

}
