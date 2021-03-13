#!/usr/bin/env bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HOME="${DIR}/data/client"
PKEY="${HOME}/.ssh/id_rsa"
LOG="${BASH_SOURCE[0]}.log"

if [ ! -e "$PKEY" ]; then
  ssh-keygen -q -t rsa -b 2048 -N '' -f "$PKEY"
fi

# https://localhost.run/
ssh -i "$PKEY" -R 80:localhost:8080 localhost.run >"$LOG" 2>&1

# ac964a33251f7f.localhost.run tunneled with tls termination, https://ac964a33251f7f.localhost.run
