@echo off

set hlsd_opts=%hlsd_opts% -v 3

call "%~dp0..\..\[http, port 8080] prefetch.bat"
