@echo off

set proxy_host=192.168.0.2
set proxy_port=8080
set proxy_url=http://%proxy_host%:%proxy_port%

rem :: https://english-livebkali.cgtn.com/live/encgtn.m3u8
rem :: https://english-livebkali.cgtn.com/live/encgtn_3.m3u8
rem ::   RESOLUTION=320x180
rem ::   (4 seconds / video segment)(6 video segments) = 24 seconds

set video_url=https://english-livebkali.cgtn.com/live/encgtn_3.m3u8
rem :: 12 seconds = (1000 ms/sec)(12 sec)
set interval_ms=12000
rem :: 4 minutes = (1000 ms/sec)(60 sec/min)(4 min)
set max_duration_ms=240000
