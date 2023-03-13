@echo off

call "%~dp0.\private.bat"

set verbosity_level=2

set hlsd_opts=%hlsd_opts% --http-proxy %http_proxy%

call "%~dp0..\%~nx0"
