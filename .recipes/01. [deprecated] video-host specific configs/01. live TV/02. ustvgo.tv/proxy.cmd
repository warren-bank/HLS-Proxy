@echo off

set port=%~1
set tls=%~2
set prefetch=%~3
set verbosity=%~4

set origin=ustvgo.tv
set referer=https://ustvgo.tv/category/entertainment/
set useragent=Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3500.0 Safari/537.36

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
  set hlsd_opts=%hlsd_opts% --prefetch --max-segments 20 --cache-key 2
)

call "%~dp0..\..\..\.bin\start_hlsd.bat"
