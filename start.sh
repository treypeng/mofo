#!/bin/bash -ex

# start InfluxDB, Chronograf and Bitmex Delta Server together
(cd stack && docker-compose up)
