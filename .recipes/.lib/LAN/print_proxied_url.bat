@echo off

call "%~dp0.\get_proxied_url.bat" %*

cls
echo URL of video stream through HLS-Proxy:
echo ======================================
echo %proxied_URL%
echo.
