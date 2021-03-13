@echo off

set recipes_home=%~dp0..\..

call "%recipes_home%\00. generic use cases\configure port mapping\public port [9090], static public host [hls-proxy.my-domain]\[http, port 8080].bat"
