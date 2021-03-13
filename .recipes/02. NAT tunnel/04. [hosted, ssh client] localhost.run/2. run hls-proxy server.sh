#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
LOG="${DIR}/1. run ssh client.sh.log"

if [ ! -e "$LOG" ]; then
  echo 'ssh client is not connected to server'
  exit 0
fi

LINE=$(tail -n 1 "$LOG")
REGEX='^([a-z0-9]+\.localhost\.run).*$'

if [[ $LINE =~ $REGEX ]]; then
  HOST="${BASH_REMATCH[1]}"
else
  echo 'ssh client output does not indicate a connection to server'
  exit 0
fi

hlsd --host "${HOST}:80" --port "8080" --req-insecure -v 1

# HTTP server is listening at: ac964a33251f7f.localhost.run:80
