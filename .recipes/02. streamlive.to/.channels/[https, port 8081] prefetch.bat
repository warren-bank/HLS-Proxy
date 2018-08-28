@echo off

set port=8081
set tls=1
set prefetch=1
set verbosity=2

call "%~dp0..\streamlive.cmd" "%port%" "%tls%" "%prefetch%" "%verbosity%"
