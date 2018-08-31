@echo off

set keystore=%~1
set port=%~2
set tls=%~3
set prefetch=%~4
set verbosity=%~5

if not defined keystore (
  echo URL of encryption key server is required!
  exit /b 1
)

set hooks_js_path=%~dp0.\auth\hooks.js
echo module.exports = {redirect: function(url){ return url.replace('https://playback.svcs.mlb.com/events/', '%keystore%') }} >"%hooks_js_path%"

set origin=https://www.mlb.com
set referer=https://www.mlb.com/live-stream-games/
set useragent=Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3500.0 Safari/537.36

set hlsd_opts=%hlsd_opts% --hooks "%hooks_js_path%"
set hlsd_opts=%hlsd_opts% --origin "%origin%" --referer "%referer%" --useragent "%useragent%"

if defined verbosity (
  set hlsd_opts=%hlsd_opts% -v "%verbosity%"
)
if defined port (
  set hlsd_opts=%hlsd_opts% --port "%port%"
)
if "%tls%"=="1" (
  set hlsd_opts=%hlsd_opts% --tls
)
if "%prefetch%"=="1" (
  set hlsd_opts=%hlsd_opts% --prefetch --max-segments 20
)

call "%~dp0..\.bin\start_hlsd.bat"
