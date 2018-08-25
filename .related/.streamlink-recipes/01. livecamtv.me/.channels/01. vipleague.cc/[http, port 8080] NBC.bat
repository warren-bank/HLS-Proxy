@echo off

rem :: HLS url obtained using "WebCast-Reloaded" on webpage:
rem ::   https://www.vipleague.cc/nbc-streaming-link-1

set url=https://e1.livecamtv.me/zmelive/xczPmTIQ75yiKfXZJjo6/playlist.m3u8
set streamID=2xnbc
set port=8080

set PATH=%~dp0..\..;%PATH%

seelive "%url%" "%streamID%" "%port%"
