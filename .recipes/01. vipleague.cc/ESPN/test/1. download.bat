@echo off

set wget_opts=
set wget_opts=%wget_opts% --header "Origin: https://www.seelive.me"
set wget_opts=%wget_opts% --header "Referer: https://www.seelive.me/sdembed?v=2xespn"
set wget_opts=%wget_opts% --header "User-Agent: Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3500.0 Safari/537.36"
set wget_opts=%wget_opts% --no-check-certificate -e robots=off
set wget_opts=%wget_opts% -P "%~dp0.\data"

call :dl "https://e11.livecamtv.me/zmelive/RKUtex2CodYBuOkTGq6A/playlist.m3u8"
call :dl "https://e11.livecamtv.me/zmelive/RKUtex2CodYBuOkTGq6A/chunklist.m3u8"
call :dl "https://key.livecamtv.me/RKUtex2CodYBuOkTGq6A/1534621801"

goto :done

:dl
  set url="%~1"
  wget %wget_opts% %url%
  goto :eof

:done
