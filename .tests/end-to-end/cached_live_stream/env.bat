@echo off

set output_dir=%~dp0.\output
set cache_dir=%output_dir%\cache
set proxy_manifest_file=%output_dir%\cached_live_stream_via_proxy.m3u8
set fpath_manifest_file=%output_dir%\cached_live_stream_via_filepath.m3u8
set mp4_video_file=%output_dir%\cached_live_stream.mp4
