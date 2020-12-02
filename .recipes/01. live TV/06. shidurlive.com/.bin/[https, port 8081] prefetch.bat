@echo off

set port=8081
set tls=1
set prefetch=1
set verbosity=1

call "%~dp0..\proxy.cmd" "%port%" "%tls%" "%prefetch%" "%verbosity%"
