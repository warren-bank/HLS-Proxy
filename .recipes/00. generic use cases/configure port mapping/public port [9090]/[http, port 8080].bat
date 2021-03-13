@echo off

set hlsd_opts=%hlsd_opts% --host ":9090"
set hlsd_opts=%hlsd_opts% -v 2

call "%~dp0..\..\%~nx0"
