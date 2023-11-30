@echo off

set verbosity_level=3

set hlsd_opts=%hlsd_opts% --hooks "%~dp0.\data\hooks.js"

call "%~dp0..\..\%~nx0"
