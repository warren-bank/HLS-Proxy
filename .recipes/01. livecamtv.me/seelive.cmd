@echo off

set streamID=%~1
set port=%~2
set tls=%~3

if not defined streamID (
  echo stream ID is required!
  exit /b 1
)

set origin=https://www.seelive.me
set referer=https://www.seelive.me/sdembed?v=%streamID%
set useragent=Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3500.0 Safari/537.36

set hlsd_js="%~dp0..\..\hls-proxy\bin\hlsd.js"

set hlsd_opts=
set hlsd_opts=%hlsd_opts% --origin "%origin%" --referer "%referer%" --useragent "%useragent%"
set hlsd_opts=%hlsd_opts% -v 1

if defined port (
  set hlsd_opts=%hlsd_opts% --port "%port%"
)
if "%tls%"=="1" (
  set hlsd_opts=%hlsd_opts% --tls
)

start "keep alive session authorization" cmd /c ""%~dp0.\auth\keep_authorization.bat" "%origin%" "%referer%" "%useragent%""

node %hlsd_js% %hlsd_opts%

if not %ERRORLEVEL% EQU 0 (
  echo.
  pause
)
