@echo off

call "%~dp0..\env.bat"

set url=%~1
set streamID=%~2
set port=%~3

if not defined url (
  echo URL of video stream is required!
  exit /b 1
)

if not defined streamID (
  echo stream ID is required!
  exit /b 1
)

if not defined port set port=8080

set origin=https://www.seelive.me
set referer=https://www.seelive.me/sdembed?v=%streamID%
set useragent=Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3500.0 Safari/537.36

set headers=
set headers=%headers% --http-header "Origin=%origin%"
set headers=%headers% --http-header "Referer=%referer%"
set headers=%headers% --http-header "User-Agent=%useragent%"

set streamlink_opts=
set streamlink_opts=%streamlink_opts% --player-external-http --player-external-http-port %port%
set streamlink_opts=%streamlink_opts% --default-stream best
set streamlink_opts=%streamlink_opts% --http-ignore-env --http-no-ssl-verify
set streamlink_opts=%streamlink_opts% --retry-open 1
set streamlink_opts=%streamlink_opts% %headers%
set streamlink_opts=%streamlink_opts% --url %url%

start "keep alive session authorization" cmd /c ""%~dp0.\auth\keep_authorization.bat" "%origin%" "%referer%" "%useragent%""

streamlink %streamlink_opts%

if not %ERRORLEVEL% EQU 0 (
  echo.
  pause
)
