@echo off

set port=%~1
set tls=%~2
set prefetch=%~3

set origin=https://www.streamlive.to
set referer=https://www.streamlive.to/channels
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
if "%prefetch%"=="1" (
  set hlsd_opts=%hlsd_opts% --prefetch --max-segments 20
)

node %hlsd_js% %hlsd_opts%

if not %ERRORLEVEL% EQU 0 (
  echo.
  pause
)
