@echo off

set proxy_url="http://localhost:8080/foo/bar/baz/proxy/hello-world"

curl --include %proxy_url%

echo.
pause
