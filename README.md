### [HTTP Live Streaming Proxy](https://github.com/warren-bank/HLS-proxy)

#### Intended Purpose:

* proxy .m3u8 files, and the .ts files they internally reference
* to all proxied files:
  * add permissive CORS response headers
* to .m3u8:
  * modify contents such that URLs in the playlist will also pass through the proxy

- - - -

### Installation and Usage: Globally

#### How to: Install:

```bash
npm install --global "@warren-bank/hls-proxy"
```

#### How to: Run the server(s):

```bash
hlsd [--help] [--tls] [--host <ip_address>] [--port <number>] [--req-headers <filepath>] [--origin <header>] [--referer <header>] [--useragent <header>] [--header <name=value>] [--prefetch] [--max-segments <number>] [-v <number>]
```

#### Examples:

1. print help<br>
  `hlsd --help`

2. start HTTP proxy at default host:port<br>
  `hlsd`

3. start HTTP proxy at default host and specific port<br>
  `hlsd --port "8080"`

4. start HTTP proxy at specific host:port<br>
  `hlsd --host "192.168.0.100" --port "8080"`

5. start HTTPS proxy at default host:port<br>
  `hlsd --tls`

6. start HTTPS proxy at specific host:port<br>
  `hlsd --tls --host "192.168.0.100" --port "8081"`

7. start HTTPS proxy at default host:port and send specific HTTP headers<br>
  `hlsd --tls --req-headers "/path/to/request/headers.json"`

8. start HTTPS proxy at default host:port and enable prefetch of 10 video segments<br>
  `hlsd --tls --prefetch --max-segments 10`

#### Options:

* _--tls_ is a flag to start HTTP**S** proxy, rather than HTTP
* _--host_ must be an IP address of the server on the LAN (so Chromecast can proxy requests through it)
  * ex: `192.168.0.100`
  * used to modify URLs in .m3u8 files
  * when this option is not specified:
    * the list of available network addresses is determined
    * if there are none, 'localhost' is used silently
    * if there is only a single address on the LAN, it is used silently
    * if there are multiple addresses:
      * they are listed
      * a prompt asks the user to choose (the numeric index) of one
* _--port_ is the port number that the server listens on
  * ex: `8080`
  * used to modify URLs in .m3u8 files
  * when this option is not specified:
    * HTTP proxy binds to: `80`
    * HTTPS proxy binds to: `443`
* _--req-headers_ is the filepath to a JSON data Object containing key:value pairs
  * each _key_ is the name of an HTTP header to send in in every outbound request
* _--origin_ is the value of the corresponding HTTP request header
* _--referer_ is the value of the corresponding HTTP request header
* _--useragent_ is the value of the corresponding HTTP request header
* _--header_ is a single name:value pair
  * this option can be used multiple times to include several HTTP request headers
  * the pair can be written:
    * "name: value"
    * "name=value"
    * "name = value"
* _--prefetch_ is a flag to enable the prefetch and caching of video segments
  * when .m3u8 files are downloaded and modified inflight, all of the URLs in the playlist are known
  * at this time, it is possible to prefetch the .ts files
  * when the .ts files are requested at a later time, the data is already cached (in memory) and can be returned immediately
* _--max-segments_ is the maximum number of .ts files (ie: video segments) to hold in the cache
  * this option is only meaningful when _--prefetch_ is enabled
  * when the cache grows larger than this size, the oldest data is removed to make room to store new data
  * when this option is not specified:
    * default value: `20`
* _-v_ sets logging verbosity level:
  * `-1`:
    * silent
  * `0` (default):
    * show errors only
  * `1`:
    * show an informative amount of information
  * `2`:
    * show technical details
  * `3`:
    * show an enhanced technical trace (useful while debugging unexpected behavior)

- - - -

### Installation and Usage: Working with a Local `git` Repo

#### How to: Install:

```bash
git clone "https://github.com/warren-bank/HLS-proxy.git"
cd "HLS-proxy"
npm install
```

#### How to: Run the server(s):

```bash
# ----------------------------------------------------------------------
# If using a port number >= 1024 on Linux, or
# If using Windows:
# ----------------------------------------------------------------------
npm start [-- [--help] [--tls] [--host <ip_address>] [--port <number>] [--req-headers <filepath>] [--origin <header>] [--referer <header>] [--useragent <header>] [--header <name=value>] [--prefetch] [--max-segments <number>] [-v <number>] ]

# ----------------------------------------------------------------------
# https://www.w3.org/Daemon/User/Installation/PrivilegedPorts.html
#
# Linux considers port numbers < 1024 to be privileged.
# Use "sudo":
# ----------------------------------------------------------------------
npm run sudo [-- [--help] [--tls] [--host <ip_address>] [--port <number>] [--req-headers <filepath>] [--origin <header>] [--referer <header>] [--useragent <header>] [--header <name=value>] [--prefetch] [--max-segments <number>] [-v <number>] ]
```

#### Examples:

1. print help<br>
  `npm start -- --help`

2. start HTTP proxy at specific host:port<br>
  `npm start -- --host "192.168.0.100" --port "8080"`

3. start HTTPS proxy at specific host:port<br>
  `npm start -- --host "192.168.0.100" --port "8081" --tls`

4. start HTTP proxy at default host:port with escalated privilege<br>
  `npm run sudo -- --port "80"`

5. start HTTPS proxy at default host:port with escalated privilege<br>
  `npm run sudo -- --port "443" --tls`

6. start HTTP proxy at specific port and send custom request headers<br>
  ```bash
headers_file="${TMPDIR}/headers.json"
echo '{"Origin" : "http://XXX:80", "Referer": "http://XXX:80/page.html"}' > "$headers_file"
npm start -- --port "8080" --req-headers "$headers_file"

URL='https://httpbin.org/headers'
URL=$(echo "$URL" | base64)
URL="http://127.0.0.1:8080/${URL}.json"
curl --silent "$URL"
```

7. start HTTPS proxy at specific port and send custom request headers<br>
  ```bash
headers_file="${TMPDIR}/headers.json"
echo '{"Origin" : "http://XXX:80", "Referer": "http://XXX:80/page.html"}' > "$headers_file"
npm start -- --port "8081" --req-headers "$headers_file" --tls -v 1

URL='https://127.0.0.1:8081/aHR0cHM6Ly9odHRwYmluLm9yZy9oZWFkZXJzCg==.json'
curl --silent --insecure "$URL"
```

8. start HTTPS proxy at specific port and send custom request headers<br>
  ```bash
h_origin='http://XXX:80'
h_referer='http://XXX:80/page.html'
h_useragent='Chromium'
h_custom_1='X-Foo: 123'
h_custom_2='X-Bar: baz'
npm start -- --port "8081" --origin "$h_origin" --referer "$h_referer" --useragent "$h_useragent" --header "$h_custom_1" --header "$h_custom_2" --tls -v 1

URL='https://127.0.0.1:8081/aHR0cHM6Ly9odHRwYmluLm9yZy9oZWFkZXJzCg==.json'
curl --silent --insecure "$URL"
```

#### Options:

* identical to the [command-line binary](#installation-and-usage-globally)

- - - -

#### Observations:

* when playing the proxied HLS video stream in an HTML5 player in a Chromium web browser (ex: THEOplayer)
  * if the page hosting the HTML5 video player is served from HTTPS:
    * when running only the HTTP proxy server:
      * the XHR requests from the player to the HTTP proxy server raise a security warning (insecure content)
      * the XHR requests get elevated to HTTPS, which are unanswered (since the HTTPS proxy server isn't running)
    * when running only the HTTPS proxy server:
      * the XHR requests from the player to the HTTPS proxy server will silently fail
      * this is because the HTTPS proxy server is using a self-signed security certificate
      * this certificate needs to be (temporarily) allowed
      * once it is, the video stream works perfectly
        * to allow the certificate:
          * browse to a URL hosted by the proxy server ( [example](https://127.0.0.1:443/aHR0cHM6Ly9naXRodWIuY29tL3dhcnJlbi1iYW5rL0hMUy1wcm94eS9yYXcvbWFzdGVyL3BhY2thZ2UuanNvbg==.json) )
          * you should see the warning: `NET::ERR_CERT_AUTHORITY_INVALID` Your connection is not private
          * click: `Advanced`
          * click: `Proceed to 127.0.0.1 (unsafe)`
          * done
* when playing the proxied HLS video stream on a Chromecast
  * the HTTP proxy server works perfectly
  * the HTTPS proxy server doesn't begin playback
    * not sure why..
    * probably has something to do with the Chromecast's browser security policies
    * a more respectable security certificate (ie: more expensive) would probably fix it

- - - -

#### Other (Loosely Related) Projects:

* [Streamlink](https://github.com/streamlink/streamlink)
  * notes:
    * this project has __way__ more features, and is __way__ more polished
    * though its main purpose is to transcode online video with ffmpeg and pipe the output into another program, it can be configured to not load a video player and instead start a web server
    * it can strongly support individual websites through single-purpose plugins
    * it can also support streams via direct URLs
      * using URLs from the wild will have mixed results, since cookies and headers and authentication aren't being managed by any plugin
  * docs:
    * [user guide](https://streamlink.github.io/#user-guide)
    * [command-line usage](https://streamlink.github.io/cli.html#command-line-usage)
    * [list of supported websites via plugins](https://streamlink.github.io/plugin_matrix.html)
  * binaries:
    * [Windows portable](https://github.com/streamlink/streamlink-portable/releases)
      * minimum system requirements:
        * Windows 7 SP1
        * .NET Framework 4.5
  * usage test:
    * `streamlink --player-external-http --player-external-http-port 8080 --default-stream best --http-ignore-env --http-no-ssl-verify --url "https://XXX/video.m3u8"`
  * usage result:
    * [doesn't appear to work with HTML5 video players or Chromecast](https://github.com/streamlink/streamlink/issues/1704#issuecomment-413661578)
    * the server starts and works as it was intended, but something about the format of the data it "streams" is incompatible
    * [VLC](https://portableapps.com/apps/music_video/vlc_portable) can play the video stream from the server, and be used to [render the video on Chromecast](https://github.com/warren-bank/HLS-proxy/blob/master/.related/.streamlink-recipes/notes.txt)

- - - -

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
