@echo off

set chrome="C:\PortableApps\SRWare Iron\67.0.3500.0\IronPortable.exe"
if not exist %chrome% set chrome=chrome

set recipes_home=%~dp0..\..

set url="https://www.cbsnews.com/common/video/cbsn_header_prod.m3u8"
set host="hls-proxy.my-domain:9090"
set tls="0"

call "%recipes_home%\.lib\WAN\get_video_player_url.bat" %url% %host% %tls%

start "video_player" %chrome% %video_player_url%
