@echo off

call "%~dp0.\env.bat"

set hlsd_opts=%hlsd_opts% --acl-whitelist "%dirname%"
set hlsd_opts=%hlsd_opts% -v 2

call "%~dp0..\..\%~nx0"
