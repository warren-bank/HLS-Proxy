#!/usr/bin/env bash

# --------------------------------------------------------------------

video_url='https://www.cbsnews.com/common/video/cbsn_header_prod.m3u8'
referer_url='https://www.cbsnews.com/live/'

# --------------------------------------------------------------------

if [ -z "$referer_url" ];then
  original_url="$video_url"
else
  original_url="${video_url}|${referer_url}"
fi

hooks_js=$(realpath '../data/hooks')
hooks_js="${hooks_js//\\/\/}"

encrypted_url=$(node -e "const hooks = require('${hooks_js}'); process.stdout.write(hooks.redirect('${original_url}'));")
cleartext_url=$(node -e "const hooks = require('${hooks_js}'); process.stdout.write(hooks.rewrite('${encrypted_url}'));")

if [ ! "$original_url" == "$encrypted_url" ];then
  echo 'encryption: OK'
else
  echo 'encryption: FAIL'
fi


if [ "$original_url" == "$cleartext_url" ];then
  echo 'roundtrip: OK'
else
  echo 'roundtrip: FAIL'
fi

# --------------------------------------------------------------------

proxy_url='http://127.0.0.1:8080'
file_extension='.m3u8'

hls_proxy_url="${proxy_url}/"$(echo -n "$encrypted_url" | base64 --wrap=0)"$file_extension"

# --------------------------------------------------------------------

echo -e "cleartext_url:\n  ${cleartext_url}"
echo -e "encrypted_url:\n  ${encrypted_url}"
echo -e "hls_proxy_url:\n  ${hls_proxy_url}"
