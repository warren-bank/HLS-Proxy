Purpose:
========
To use the proxy to cache a live HLS stream to the filesystem.
The size of the cache is (nearly) unlimited.
The life-span of the cache is unlimited.
A cumulative manifest is dynamically generated;
it contains URLs that point to the proxy,
and are read by the proxy from the filesystem cache.

Limitation:
===========
The mapping from URLs to the filenames used by the filesystem cache
only exists in RAM until the proxy is stopped.

Usage:
======
1. edit: config.bat
2. run: start_hlsd.bat
3. run: serve --listen tcp:localhost:80 --cors ./output
4: urls:
   - manifest:
       http://localhost/cached_live_stream.m3u8
   - video player:
       http://webcast-reloaded.surge.sh/4-clappr/index.html#/watch/aHR0cDovL2xvY2FsaG9zdC9jYWNoZWRfbGl2ZV9zdHJlYW0ubTN1OA%253D%253D
