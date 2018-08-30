@echo off

set hlsd_opts=%hlsd_opts% --port 8080
set hlsd_opts=%hlsd_opts% -v 1

call "%~dp0..\.bin\start_hlsd.bat"
