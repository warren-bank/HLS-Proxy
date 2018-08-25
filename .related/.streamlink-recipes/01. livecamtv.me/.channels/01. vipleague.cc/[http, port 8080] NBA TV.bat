@echo off

rem :: HLS url obtained using "WebCast-Reloaded" on webpage:
rem ::   https://www.vipleague.cc/nba-tv-streaming-link-1

set url=https://e1.livecamtv.me/zmelive/J0SrB4amf3YORDoMtwvs/playlist.m3u8
set streamID=nbatv
set port=8080

set PATH=%~dp0..\..;%PATH%

seelive "%url%" "%streamID%" "%port%"
