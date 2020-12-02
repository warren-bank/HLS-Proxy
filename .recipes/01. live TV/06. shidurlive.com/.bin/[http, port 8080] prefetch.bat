@echo off

set port=8080
set tls=0
set prefetch=1
set verbosity=1

call "%~dp0..\proxy.cmd" "%port%" "%tls%" "%prefetch%" "%verbosity%"
