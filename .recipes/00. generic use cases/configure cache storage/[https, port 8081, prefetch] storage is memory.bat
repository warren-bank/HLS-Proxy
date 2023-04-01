@echo off

set hlsd_opts=%hlsd_opts% --cache-storage "memory"

call "%~dp0..\[https, port 8081] prefetch.bat"
