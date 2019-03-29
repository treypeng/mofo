#!/bin/bash -ex

# start InfluxDB, Chronograf and Bitmex Delta Server together
# starts in background, remove -d flag if needed
(cd stack && docker-compose up -d)
