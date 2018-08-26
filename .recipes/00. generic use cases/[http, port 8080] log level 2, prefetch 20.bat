@echo off

set hlsd_js="%~dp0..\..\hls-proxy\bin\hlsd.js"

set hlsd_opts=
set hlsd_opts=%hlsd_opts% --port 8080
set hlsd_opts=%hlsd_opts% --prefetch --max-segments 20
set hlsd_opts=%hlsd_opts% -v 2

node %hlsd_js% %hlsd_opts%

if not %ERRORLEVEL% EQU 0 (
  echo.
  pause
)
