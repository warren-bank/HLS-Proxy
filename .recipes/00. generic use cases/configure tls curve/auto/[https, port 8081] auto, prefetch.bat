@echo off

rem :: --------------------------------------------------------------------------
rem :: https://github.com/nodejs/node/issues/16196
rem :: --------------------------------------------------------------------------
rem :: this setting is a workaround for the error:
rem ::     "SSL routines:SSL23_GET_SERVER_HELLO:sslv3 alert handshake failure"
rem :: --------------------------------------------------------------------------

set hlsd_opts=%hlsd_opts% --req-secure-curve "auto"

call "%~dp0..\..\[https, port 8081] prefetch.bat"
