@echo off

set url=%~1
set buffer_ms=%~2

if not defined url (
  echo URL of video stream is required!
  exit /b 1
)

if not defined buffer_ms set buffer_ms=5000

set VLC_home=C:\PortableApps\VLC\3.0.3
set VLC_exe="%VLC_home%\VLCPortable.exe"
if not exist %VLC_exe% set VLC_exe=vlc

set VLC_opts=
set VLC_opts=%VLC_opts% --start-paused
set VLC_opts=%VLC_opts% --network-caching %buffer_ms%

start "VLC" %VLC_exe% %VLC_opts% %url%
