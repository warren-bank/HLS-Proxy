@echo off

set PATH=%~dp0.\bin;%PATH%

set HOME=%~dp0.\data\client

call expose share localhost:8080 --subdomain=hls-proxy

rem :: Thank you for using expose.
rem ::
rem :: Local-URL:        localhost:8080
rem :: Dashboard-URL:    http://127.0.0.1:4040
rem :: Expose-URL:       http://hls-proxy.my-domain:9090
