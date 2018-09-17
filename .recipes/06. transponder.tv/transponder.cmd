@echo off

set bitrate=%~1
set port=%~2
set tls=%~3
set prefetch=%~4
set verbosity=%~5

rem :: ---------------------------------
rem :: valid options for "bitrate":
rem ::   * "lo"  // 240p
rem ::   * "med" // 360p
rem ::   * "hi"  // 480p
rem :: ---------------------------------

set hooks_js_path=%~dp0.\auth\hooks.js
set bitrates=lo^^^|med^^^|hi
echo module.exports = {redirect: function(url){ if ('%bitrate%') return url.replace(/_(?:%bitrates%)-(\d+\.ts)/i, '_%bitrate%-$1'); }} >"%hooks_js_path%"

set origin=https://www.transponder.tv
set referer=https://www.transponder.tv/nownext
set useragent=Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3500.0 Safari/537.36

set hlsd_opts=%hlsd_opts% --hooks "%hooks_js_path%"
set hlsd_opts=%hlsd_opts% --origin "%origin%" --referer "%referer%" --useragent "%useragent%"
set hlsd_opts=%hlsd_opts% --cache-key 1

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
