@echo off

rem :: "keystore" obtained with "bilasport.user.js" on:
rem ::   http://bilasport.net/mlb/twins.html

set keystore=http://bilasport.net/keys/Twins.file?

call "%~dp0.\.common_options.bat"

mlb "%keystore%" "%bitrate%" "%port%" "%tls%" "%prefetch%" "%verbosity%"
