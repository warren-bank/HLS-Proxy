@echo off
setlocal enabledelayedexpansion

set tls=%~3

call "%~dp0.\get_proxied_url.bat" %*

set tmp_file_in="%~dp0.\temp1.txt"
set tmp_file_out="%~dp0.\temp2.txt"

rem :: echo %proxied_URL%>%tmp_file_in%
echo|set /P ="%proxied_URL%">%tmp_file_in%

certutil -encode %tmp_file_in% %tmp_file_out%
findstr /v /c:- %tmp_file_out% > %tmp_file_in%
set b64=
for /f "tokens=* usebackq delims=" %%a in (%tmp_file_in%) do set b64=!b64!%%a
del %tmp_file_in%
del %tmp_file_out%

if "%tls%"=="1" (
  set "url=https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html#/watch/!b64!"
) else (
  set "url=http://webcast-reloaded.surge.sh/index.html#/watch/!b64!"
)

endlocal & (
  set "video_player_url=%url%"
)
