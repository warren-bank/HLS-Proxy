@echo off

set bitrate=%~1
set port=%~2
set tls=%~3
set prefetch=%~4
set verbosity=%~5

rem :: ---------------------------------
rem :: valid options for "bitrate":
rem ::   * "1"  //  1920x1080
rem ::   * "2"  //  1280x720
rem ::   * "3"  //   640x480
rem ::   * "4"  //   320x240
rem :: ---------------------------------

set hooks_js_path=%~dp0.\auth\hooks.js
echo module.exports = {redirect: function(url){ if ('%bitrate%') if (/\.m3u8/i.test(url)) if (! /index_%bitrate%\.m3u8/i.test(url)) return 'index_%bitrate%.m3u8'; return url; }} >"%hooks_js_path%"

set origin=http://bankai.stream
set referer=http://bankai.stream/
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

call "%~dp0..\..\..\.bin\start_hlsd.bat"
