Purpose:
========
To use the proxy to cache a live HLS stream to the filesystem.
The size of the cache is (nearly) unlimited.
The life-span of the cache is unlimited.
A cumulative manifest is dynamically generated.

Cumulative live HLS manifest via proxy:
=======================================
file:
  ./output/cached_live_stream_via_proxy.m3u8

notes:
  It contains URLs that point to the proxy,
  and are read by the proxy from the filesystem cache.

limitation:
  The mapping from proxied URLs to local file paths,
  which are used by the filesystem storage cache,
  only exists in RAM until the proxy is stopped.

Cumulative live HLS manifest via filepath:
==========================================
file:
  ./output/cached_live_stream_via_filepath.m3u8

notes:
  It replaces proxied URLs with local file paths,
  and can still be used after the proxy is stopped.

Usage:
======
1. edit: config.bat
2. run: 1_start_hlsd.bat
3. run: serve --listen tcp:localhost:80 --cors ./output
4: urls:
   - manifest:
       http://localhost/cached_live_stream_via_proxy.m3u8
   - video player:
       http://webcast-reloaded.surge.sh/4-clappr/index.html#/watch/aHR0cDovL2xvY2FsaG9zdC9jYWNoZWRfbGl2ZV9zdHJlYW1fdmlhX3Byb3h5Lm0zdTg%253D

Usage (advanced):
=================
5. run: 2_convert_to_mp4.bat
   - after the proxy server is stopped,
     to convert the HLS manifest (with filepaths) to mp4
