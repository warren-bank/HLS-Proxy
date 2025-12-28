#!/usr/bin/env bash

echo 'test pre-conditions:'
echo '  hlsd --port 8080'
echo ''

proxy_url='http://127.0.0.1:8080'
request_url='http://httpbin.org/headers'
referer_url='https://example.com/videos.html'
file_extension='.txt'

hls_proxy_url="${proxy_url}/"$(echo -n "${request_url}|${referer_url}" | base64 --wrap=0)"$file_extension"
headers=$(echo -n '{"x-foo": "Foo", "x-bar": "Bar", "x-baz": "Baz"}' | base64 --wrap=0)

curl --silent "${hls_proxy_url}?headers=${headers}"
