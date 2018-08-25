@echo off

rem :: HLS url obtained using "WebCast-Reloaded" on webpage:
rem ::   https://www.vipleague.cc/hbo-streaming-link-1

set url=https://e1.livecamtv.me/zmelive/6rIAHeghLaYNOscpJQW8/playlist.m3u8
set streamID=hbosd
set port=8080

set PATH=%~dp0..\..;%PATH%

seelive "%url%" "%streamID%" "%port%"
