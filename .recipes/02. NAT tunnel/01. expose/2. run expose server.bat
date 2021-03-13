@echo off

set PATH=%~dp0.\bin;%PATH%

set HOME=%~dp0.\data\server

call expose serve my-domain --port=9090

rem :: Expose server running on port 9090.
