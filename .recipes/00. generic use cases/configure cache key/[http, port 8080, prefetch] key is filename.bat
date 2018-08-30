@echo off

set hlsd_opts=%hlsd_opts% --cache-key 1

call "%~dp0..\[http, port 8080] prefetch.bat"
