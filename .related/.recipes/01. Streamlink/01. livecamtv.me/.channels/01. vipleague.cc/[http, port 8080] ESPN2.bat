@echo off

rem :: HLS url obtained using "WebCast-Reloaded" on webpage:
rem ::   https://www.vipleague.cc/espn-2-streaming-link-1

set url=https://e1.livecamtv.me/zmelive/Qy4A0r6jvBxeaoIpsgZW/playlist.m3u8
set streamID=2xespn2
set port=8080

set PATH=%~dp0..\..;%PATH%

seelive "%url%" "%streamID%" "%port%"
