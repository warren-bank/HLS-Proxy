@echo off

set keystore=http://bilasport.net/keys/Dodgers.file?
set port=8080
set tls=0
set prefetch=0
set verbosity=1

rem :: HLS url obtained using "WebCast-Reloaded" on webpage:
rem ::   http://bilasport.net/game/los-angeles-dodgers-vs-arizona-diamondbacks-7691.html
rem :: keystore obtained from javascript on the embedded iframe:
rem ::   http://bilasport.net/mlb/dodgers.html

set video_URL=https://hlslive-l3c-ewr1.media.mlb.com/ls01/mlb/2018/08/31/Home_VIDEO_eng_Arizona_Diamondbacks_Los__20180831_1535672988710/master_desktop_complete.m3u8
set play_in_VLC=0

set PATH=%~dp0..\..;%PATH%

call "%~dp0..\..\..\.lib\print_proxied_url.bat" "%video_URL%" "%port%" "%tls%"

if "%play_in_VLC%"=="1" call "%~dp0..\..\..\.bin\play_in_VLC.cmd" "%proxied_URL%"

mlb "%keystore%" "%port%" "%tls%" "%prefetch%" "%verbosity%"
