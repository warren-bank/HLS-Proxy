@echo off

call "%~dp0.\env.bat"

set output_dir=%~dp0.\output
set cache_dir=%output_dir%\cache
set output_manifest_file=%output_dir%\cached_live_stream.m3u8
set hooks_js="%~dp0.\hooks.js"

rem :: largest 32-bit signed integer
set max_integer=2147483647

set hlsd_opts=
set hlsd_opts=%hlsd_opts% --host %proxy_host%
set hlsd_opts=%hlsd_opts% --port %proxy_port%
set hlsd_opts=%hlsd_opts% --req-insecure
set hlsd_opts=%hlsd_opts% --prefetch --max-segments %max_integer% --cache-timeout 0
set hlsd_opts=%hlsd_opts% --cache-storage filesystem --cache-storage-fs-dirpath "%cache_dir%"
set hlsd_opts=%hlsd_opts% --hooks "%hooks_js%"

if exist "%output_dir%" rmdir /Q /S "%output_dir%"
mkdir "%output_dir%"
mkdir "%cache_dir%"

call "%~dp0..\..\..\.recipes\.bin\start_hlsd.bat"
