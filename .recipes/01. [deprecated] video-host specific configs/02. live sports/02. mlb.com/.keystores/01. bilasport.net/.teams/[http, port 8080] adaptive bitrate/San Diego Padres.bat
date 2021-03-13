@echo off

rem :: "keystore" obtained with "bilasport.user.js" on:
rem ::   http://bilasport.net/mlb/padres.html

set keystore=http://bilasport.net/keys/Padres.file?

call "%~dp0.\.common_options.bat"

mlb "%keystore%" "%bitrate%" "%port%" "%tls%" "%prefetch%" "%verbosity%"
