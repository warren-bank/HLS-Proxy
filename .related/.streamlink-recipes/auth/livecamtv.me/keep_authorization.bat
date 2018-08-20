@echo off

set url="https://auth.livecamtv.me"

set origin=%~1
set referer=%~2
set useragent=%~3

set cookie_jar="%~dp0.\cookies.txt"

set wget_opts=
set wget_opts=%wget_opts% --load-cookies %cookie_jar% --save-cookies %cookie_jar% --keep-session-cookies
set wget_opts=%wget_opts% --no-check-certificate -e robots=off
set wget_opts=%wget_opts% --header="Origin: %origin%"
set wget_opts=%wget_opts% --referer="%referer%"
set wget_opts=%wget_opts% --user-agent="%useragent%"
set wget_opts=%wget_opts% -O -

cls
echo This terminal window is entering an infinite loop..
echo The video website will be contacted once every 5 minutes to keep the video session active.
echo.
echo You may close this terminal window once the video has ended.
echo.

if exist %cookie_jar% del %cookie_jar%

:iterate
wget %wget_opts% %url% >NUL 2>&1

rem :: (60 sec/min)(5 min) = 300
timeout 300 /nobreak >NUL
goto :iterate
