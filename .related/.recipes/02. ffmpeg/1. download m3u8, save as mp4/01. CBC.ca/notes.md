#### notes

* the website __and__ data streams are georestricted
  * only IP addresses within Canada are allowed
  * use a VPN
* the master manifest includes several adaptive bitrates
  * their URLs follow a naming convention:
    * `_(a|v)(\d)/prog_index.m3u8`
      * `$1` indicates whether the stream is audio (`a`) or video (`v`)
      * `$2` indicates the bitrate and video resolution (ex: `7` is 720p at 30 fps)
* audio and video are split into separate .m3u8 streams for all bitrates
* `ffmpeg` can download each of the streams individually
  * this step is insanely _slow_
    * on the order of the same time it takes to watch (or listen to) each stream
* `ffmpeg` can then mux the individual audio and video files into a single file that includes both
  * audio is in sync
  * subtitles track(s) are retained
