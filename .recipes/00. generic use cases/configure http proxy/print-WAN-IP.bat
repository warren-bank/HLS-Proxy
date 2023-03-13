@echo off

set log="%~dp0.\private.log"

set url_direct="https://httpbin.org/ip"
set url_proxied="http://127.0.0.1:8080/aHR0cHM6Ly9odHRwYmluLm9yZy9pcA==.json"

echo real WAN IP:>%log%
curl -s -S %url_direct% >>%log%

echo.>>%log%

echo proxied WAN IP:>>%log%
curl -s -S %url_proxied% >>%log%
