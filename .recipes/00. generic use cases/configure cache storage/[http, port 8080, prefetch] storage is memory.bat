@echo off

set hlsd_opts=%hlsd_opts% --cache-storage "memory"

call "%~dp0..\[http, port 8080] prefetch.bat"
