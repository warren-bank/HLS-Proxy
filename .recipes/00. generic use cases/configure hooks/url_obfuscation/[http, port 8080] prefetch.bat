@echo off

set verbosity_level=1

set hlsd_opts=%hlsd_opts% --hooks "%~dp0.\data\hooks.js"

call "%~dp0..\..\%~nx0"
