@echo off

if not defined verbosity_level (
  set verbosity_level=1
)

set hlsd_opts=%hlsd_opts% --port 8080

call "%~dp0..\.bin\start_hlsd.bat"
