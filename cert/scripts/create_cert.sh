#!/usr/bin/env bash

cd ..

if [ -e key.pem ]; then
  rm key.pem
fi

if [ -e cert.pem ]; then
  rm cert.pem
fi

openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 36500
