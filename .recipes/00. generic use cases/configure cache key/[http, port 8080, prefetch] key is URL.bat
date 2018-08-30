@echo off

set hlsd_opts=%hlsd_opts% --cache-key 2

call "%~dp0..\[http, port 8080] prefetch.bat"
