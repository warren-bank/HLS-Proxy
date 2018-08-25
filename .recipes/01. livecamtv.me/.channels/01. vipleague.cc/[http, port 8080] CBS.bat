@echo off

set streamID=2xcbs
set port=8080
set tls=0

set PATH=%~dp0..\..;%PATH%

rem :: HLS url obtained using "WebCast-Reloaded" on webpage:
rem ::   https://www.vipleague.cc/cbs-streaming-link-1

call "%~dp0..\..\..\.lib\print_proxied_url.bat" "https://e1.livecamtv.me/zmelive/cjbq9yfp8WGvsRBkChFi/playlist.m3u8" "%port%" "%tls%"

seelive "%streamID%" "%port%" "%tls%"
