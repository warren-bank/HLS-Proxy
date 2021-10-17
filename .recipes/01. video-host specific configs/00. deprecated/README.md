Recipes having video-host specific configs are now considered deprecated.

Nearly all such recipes contain 99% identical boilerplate, and only vary by the "Referer" and "Origin" request headers that are sent to the video-host.

A [recent update](https://github.com/warren-bank/HLS-Proxy/releases/tag/v0.18.0) allows these 2x request headers to be configured per video stream within the URL sent to _HLS Proxy_.
The format to construct such a URL is described in the top-level [README](https://github.com/warren-bank/HLS-Proxy/blob/master/README.md#url-format).
