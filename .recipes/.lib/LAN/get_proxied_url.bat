@echo off
setlocal enabledelayedexpansion

set url=%~1
set port=%~2
set tls=%~3

set tmp_file_in="%~dp0.\temp1.txt"
set tmp_file_out="%~dp0.\temp2.txt"

rem :: echo %url%>%tmp_file_in%
echo|set /P ="%url%">%tmp_file_in%

certutil -encode %tmp_file_in% %tmp_file_out%
findstr /v /c:- %tmp_file_out% > %tmp_file_in%
set b64=
for /f "tokens=* usebackq delims=" %%a in (%tmp_file_in%) do set b64=!b64!%%a
del %tmp_file_in%
del %tmp_file_out%

set url=http
if "%tls%"=="1" set url=%url%s
set url=%url%://localhost
if defined port set url=%url%:%port%
set url=%url%/!b64!.m3u8

endlocal & (
  set "proxied_URL=%url%"
)
