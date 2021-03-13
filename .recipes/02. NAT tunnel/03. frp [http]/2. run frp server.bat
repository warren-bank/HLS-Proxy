@echo off

call "%~dp0.\0. env.bat"

set HOME=%~dp0.\data\server

frps -c "%HOME%\frps.ini"

rem :: frps tcp listen on 0.0.0.0:7000
rem :: http service listen on 0.0.0.0:9090
rem :: Dashboard listen on 0.0.0.0:7500
rem :: frps started successfully
