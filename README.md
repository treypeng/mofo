
## MOFO

Scrapes instrument tick data from BitMEX and writes to an Influx timeseries database.
Also provides real-time streaming visualisation using Chronograf (see bottom of this readme for more info)

Will probably subsume this whole thing into a solid stack at some point. Naked nodejs service for now.

### Installation


```
npm install
```


### Configuration

There are two config files. One for the scraper `./stack/bitmex-delta-server/bitmex-delta-server.js`

**You must edit this before booting to choose which instruments to scrape.** Defaults; XBTUSD, ETHUSD.

And another for the database writer which polls the scraper `./conf/config.js`. Again, edit this to select which instruments to write. I might streamline this config at a later date.


### Running

To initialise the database and scraper servers in the background:

```
./start.sh
```

Then to begin db writing

```
npm start
```
Can you npm's Forever service to run in background.
Press Escape to stop the writing service.

### Terminating

To quit the background scraper and db services and remove the containers run:

```
./stop.sh
```


## Visualisation

The stack comes with Chronograf via a web based UI. It's proper nice. You can visually add and arrange real-time metrics widgets (presets included) and also complex queries if needed. Pretty intuitive and easy to use, takes seconds to add a widget showing the real-time mark price graph, open interest whatever. 

Connect to it with your network host IP (e.g. 192.168.xx.xx) rather than loopback. Also use the same host ip when telling it where to find the data (InfluxDb) 
