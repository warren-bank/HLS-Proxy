@echo off

rem :: "keystore" obtained with "bilasport.user.js" on:
rem ::   http://bilasport.net/mlb/rockies.html

set keystore=http://bilasport.net/keys/Rockies.file?

call "%~dp0.\.common_options.bat"

mlb "%keystore%" "%bitrate%" "%port%" "%tls%" "%prefetch%" "%verbosity%"
