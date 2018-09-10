@echo off

rem :: HLS url obtained using "WebCast-Reloaded" on webpage:
rem ::   https://www.vipleague.cc/nfl-network-streaming-link-1

set url=https://e1.livecamtv.me/zmelive/4ornXB7aDZHLViI6JS0b/playlist.m3u8
set streamID=nflnettv
set port=8080

set PATH=%~dp0..\..;%PATH%

seelive "%url%" "%streamID%" "%port%"
