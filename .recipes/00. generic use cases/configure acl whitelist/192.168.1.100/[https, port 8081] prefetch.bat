@echo off

call "%~dp0.\env.bat"

set verbosity_level=2

set hlsd_opts=%hlsd_opts% --acl-whitelist "%dirname%"

call "%~dp0..\..\%~nx0"
