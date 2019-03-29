#!/bin/bash -ex

# Stops services and removes containers
(cd stack && docker-compose down)
