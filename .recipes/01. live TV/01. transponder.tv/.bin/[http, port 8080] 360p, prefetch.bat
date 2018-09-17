@echo off

set bitrate=med
set port=8080
set tls=0
set prefetch=1
set verbosity=1

call "%~dp0..\transponder.cmd" "%bitrate%" "%port%" "%tls%" "%prefetch%" "%verbosity%"
