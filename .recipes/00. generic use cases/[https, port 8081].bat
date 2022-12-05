@echo off

if not defined verbosity_level (
  set verbosity_level=1
)

set hlsd_opts=%hlsd_opts% --tls
set hlsd_opts=%hlsd_opts% --port 8081

call "%~dp0..\.bin\start_hlsd.bat"
