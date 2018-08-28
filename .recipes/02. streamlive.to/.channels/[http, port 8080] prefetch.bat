@echo off

set port=8080
set tls=0
set prefetch=1

call "%~dp0..\streamlive.cmd" "%port%" "%tls%" "%prefetch%"
