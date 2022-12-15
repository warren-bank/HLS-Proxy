@echo off

set verbosity_level=2

set hlsd_opts=%hlsd_opts% --host ":9090"

call "%~dp0..\..\%~nx0"
