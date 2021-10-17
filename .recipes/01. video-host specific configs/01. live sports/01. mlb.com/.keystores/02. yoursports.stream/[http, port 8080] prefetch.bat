@echo off

call "%~dp0.\.common_options.bat"

set port=8080
set tls=0
set prefetch=1
set verbosity=1

mlb "%keystore%" "%bitrate%" "%port%" "%tls%" "%prefetch%" "%verbosity%"
