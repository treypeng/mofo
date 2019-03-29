
## MOFO

Scrapes instrument tick data from BitMEX and writes to an Influx timeseries database.
Will probably subsume this whole thing into a solid stack at some point. Naked nodejs service for now.

```npm install```

There are two config files. One for the scraper `./stack/bitmex-delta-server/bitmex-delta-server.js`

**You must edit this before booting to choose which instruments to scrape.** Defaults; XBTUSD, ETHUSD.

And another for the database writer which polls the scraper `./conf/config.js`. Again, edit this to select which instruments to write. I might streamline this config at a later date.

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


To quit the background scraper and db services and remove the containers run:

```
./stop.sh
```