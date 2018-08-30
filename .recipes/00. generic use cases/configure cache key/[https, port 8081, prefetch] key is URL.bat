@echo off

set hlsd_opts=%hlsd_opts% --cache-key 2

call "%~dp0..\[https, port 8081] prefetch.bat"
