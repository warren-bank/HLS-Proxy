@echo off

set streamID=2xnfl1hd~2xnfl1a
set port=8080
set tls=0

set PATH=%~dp0..\..;%PATH%

rem :: HLS url obtained using "WebCast-Reloaded" on webpage:
rem ::   https://www.nflstream.io/carolina-panthers-vs-new-england-patriots-live/stream-1

call "%~dp0..\..\..\.lib\print_proxied_url.bat" "https://e1.livecamtv.me/zmelive/przN2abEtUVWYkSDFI3y/playlist.m3u8" "%port%" "%tls%"

seelive "%streamID%" "%port%" "%tls%"
