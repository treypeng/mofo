

Use the `./start.sh` script in parent directory to boot the servers

Upon boot, will create two directories here:

`./influxdb/` will contain our tick database so don't delete that. You can edit the
host mouth path in `docker-compose.yml` if wanted.

`./chronograf/` dir contains the dashboard layout, not critical but don't delete if you
want your dash to persist lol
