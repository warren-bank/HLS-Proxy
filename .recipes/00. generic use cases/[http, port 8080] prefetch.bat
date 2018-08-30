@echo off

set hlsd_opts=%hlsd_opts% --prefetch --max-segments 20

call "%~dp0.\[http, port 8080].bat"
