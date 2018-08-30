@echo off

set hlsd_opts=%hlsd_opts% -v 2

call "%~dp0..\..\[http, port 8080].bat"
