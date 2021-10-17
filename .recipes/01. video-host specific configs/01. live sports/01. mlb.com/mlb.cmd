@echo off

set keystore=%~1
set bitrate=%~2
set port=%~3
set tls=%~4
set prefetch=%~5
set verbosity=%~6

if not defined keystore (
  echo URL of encryption key server is required!
  exit /b 1
)

rem :: ---------------------------------
rem :: valid options for "bitrate":
rem ::   *  "192"  //   320x180 @ 30 fps
rem ::   *  "514"  //   384x216 @ 30 fps
rem ::   *  "800"  //   512x288 @ 30 fps
rem ::   * "1200"  //   640x360 @ 30 fps
rem ::   * "1800"  //   896x504 @ 30 fps
rem ::   * "2500"  //   960x540 @ 30 fps
rem ::   * "3500"  //  1280x720 @ 30 fps
rem ::   * "5600"  //  1280x720 @ 60 fps
rem :: ---------------------------------

set hooks_js_path=%~dp0.\auth\hooks.js
echo module.exports = {redirect: function(url){ if ('%bitrate%') if (/\.m3u8/i.test(url)) if (! /%bitrate%K\/%bitrate%_complete\.m3u8/i.test(url)) return '%bitrate%K/%bitrate%_complete.m3u8'; return url.replace(new RegExp('(https?://playback\\.svcs\\.mlb\\.com/)((?:silk/)?events/)'), '%keystore%'); }} >"%hooks_js_path%"

set origin=https://www.mlb.com
set referer=https://www.mlb.com/
set useragent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36

set hlsd_opts=%hlsd_opts% --hooks "%hooks_js_path%"
set hlsd_opts=%hlsd_opts% --origin "%origin%" --referer "%referer%" --useragent "%useragent%"
set hlsd_opts=%hlsd_opts% --req-insecure

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
  set hlsd_opts=%hlsd_opts% --prefetch --max-segments 20 --cache-key 2
)

call "%~dp0..\..\..\.bin\start_hlsd.bat"
