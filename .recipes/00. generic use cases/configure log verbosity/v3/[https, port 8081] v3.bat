@echo off

set hlsd_opts=%hlsd_opts% -v 3

call "%~dp0..\..\[https, port 8081].bat"
