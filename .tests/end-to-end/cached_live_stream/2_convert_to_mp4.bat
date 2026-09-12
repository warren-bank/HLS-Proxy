@echo off

call "%~dp0.\env.bat"

if not exist "%fpath_manifest_file%" (
  echo HLS manifest file not found!
  exit /b 1
)

set ffmpeg_opts=
set ffmpeg_opts=%ffmpeg_opts% -allowed_extensions ALL
set ffmpeg_opts=%ffmpeg_opts% -i "%fpath_manifest_file%"
set ffmpeg_opts=%ffmpeg_opts% -c copy -movflags +faststart
set ffmpeg_opts=%ffmpeg_opts% "%mp4_video_file%"

call ffmpeg %ffmpeg_opts% >"%output_dir%\%~n0.log" 2>&1
