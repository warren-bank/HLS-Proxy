@echo off

start "keep alive session authorization" cmd /c "%~dp0.\auth\keep_authorization.bat"

set port=8080
set req_headers="%~dp0.\req-headers.json"

set hlsd_js="%~dp0..\..\..\hls-proxy\bin\hlsd.js"

node %hlsd_js% -v 1 --port %port% --req-headers %req_headers%
