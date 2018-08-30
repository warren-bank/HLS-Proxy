@echo off

set hlsd_opts=%hlsd_opts% --prefetch --max-segments 20

call "%~dp0.\[https, port 8081].bat"
