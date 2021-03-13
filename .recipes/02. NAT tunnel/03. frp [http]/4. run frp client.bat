@echo off

call "%~dp0.\0. env.bat"

set HOME=%~dp0.\data\client

frpc -c "%HOME%\frpc.ini"

rem :: login to server success
rem :: proxy added: [hls-proxy]
rem :: admin server listen on 127.0.0.1:7400
rem :: [hls-proxy] start proxy success
