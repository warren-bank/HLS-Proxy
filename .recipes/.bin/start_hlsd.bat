@echo off

set hlsd_js="%~dp0..\..\hls-proxy\bin\hlsd.js"

node %hlsd_node_opts% %hlsd_js% %hlsd_opts%

if not %ERRORLEVEL% EQU 0 (
  echo.
  pause
)
