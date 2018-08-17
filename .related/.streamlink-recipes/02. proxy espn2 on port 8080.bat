@echo off

set streamlink_home=C:\PortableApps\Streamlink\0.14.2
set PATH=%streamlink_home%;%PATH%

set port=8080

rem :: HLS url obtained using WebCast on webpage:
rem ::   https://www.vipleague.cc/espn-2-streaming-link-1

set url="https://e7.livecamtv.me/zmelive/Qy4A0r6jvBxeaoIpsgZW/playlist.m3u8"

set header_01=Origin=https://www.seelive.me
set header_02=Referer=https://www.seelive.me/sdembed?v=2xespn2
set header_03=User-Agent=Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3500.0 Safari/537.36

set headers=--http-header "%header_01%" --http-header "%header_02%" --http-header "%header_03%"

set streamlink_opts=
set streamlink_opts=%streamlink_opts% --player-external-http --player-external-http-port %port%
set streamlink_opts=%streamlink_opts% --default-stream best
set streamlink_opts=%streamlink_opts% --http-ignore-env --http-no-ssl-verify
set streamlink_opts=%streamlink_opts% --retry-open 1
set streamlink_opts=%streamlink_opts% %headers%
set streamlink_opts=%streamlink_opts% --url %url%

streamlink %streamlink_opts%

if not %ERRORLEVEL% EQU 0 (
  echo.
  pause
)
