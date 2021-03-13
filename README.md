### [_HLS Proxy_](https://github.com/warren-bank/HLS-Proxy) : HTTP Live Streaming Proxy

#### Basic Functionality:

* proxy .m3u8 files, and the video segments (.ts files) they internally reference
* to all proxied files:
  * add permissive CORS response headers
* to .m3u8:
  * modify contents such that URLs in the playlist will also pass through the proxy

#### Advanced Features:

* inject custom HTTP headers in all outbound proxied requests
* prefetch video segments (.ts files)
* use a hook function to conditionally decide which video segments to prefetch
* use a hook function to conditionally redirect URLs in the playlist (before they're modified to pass through the proxy)

#### Benefits:

* any video player (on the LAN) can access the proxied video stream
  * including Chromecast
* prefetch and caching of video segments ahead-of-time makes playback of the video stream very stable
  * solves buffering problems
* the proxy can easily be configured to bypass many of the security measures used by video servers to restrict access:
  * CORS response headers (to XHR requests)
    * used by web browsers to enforce a security policy that limits which website(s) may access the content
  * HTTP request headers
    * `Origin` and `Referer` are often inspected by the server
      * when these headers don't match the site hosting the content, a `403 Forbidden` response is returned (in lieu of the requested data)
  * restricted access to encryption keys
    * often times the encrypted video segments (.ts files) are readily available, but the encryption keys are well protected
      * if the keys can be obtained from another source, then a hook function can be used to redirect only those URL requests

- - - -

#### URL Format:

* [example Javascript]: construction of URL to _HLS Proxy_ for video stream
  ```javascript
    {
      const proxy_url      = 'http://127.0.0.1:8080'
      const video_url      = 'https://example.com/video/master.m3u8'
      const file_extension = '.m3u8'

      const hls_proxy_url  = `${proxy_url}/${ btoa(video_url) }${file_extension}`
    }
  ```
* [example Javascript]: construction of URL to _HLS Proxy_ for video stream w/ "Referer" request header
  ```javascript
    {
      const proxy_url      = 'http://127.0.0.1:8080'
      const video_url      = 'https://example.com/video/master.m3u8'
      const referer_url    = 'https://example.com/videos.html'
      const file_extension = '.m3u8'

      const hls_proxy_url  = `${proxy_url}/${ btoa(`${video_url}|${referer_url}`) }${file_extension}`
    }
  ```
* [example Bash]: construction of URL to _HLS Proxy_ for video stream
  ```bash
    proxy_url='http://127.0.0.1:8080'
    video_url='https://example.com/video/master.m3u8'
    file_extension='.m3u8'

    hls_proxy_url="${proxy_url}/"$(echo -n "$video_url" | base64 --wrap=0)"$file_extension"
  ```
* [example Bash]: construction of URL to _HLS Proxy_ for video stream w/ "Referer" request header
  ```bash
    proxy_url='http://127.0.0.1:8080'
    video_url='https://example.com/video/master.m3u8'
    referer_url='https://example.com/videos.html'
    file_extension='.m3u8'

    hls_proxy_url="${proxy_url}/"$(echo -n "${video_url}|${referer_url}" | base64 --wrap=0)"$file_extension"
  ```

##### notes:

* adding a file extension to the base64 encoded video URL is optional
  - doing so allows video clients to recognize that the URL being requested from _HLS Proxy_ is an HLS video stream

##### high-level tools that automate this task:

* refer to the section: [Other Projects](#other-projects)

- - - -

### Installation and Usage: Globally

#### How to: Install:

```bash
npm install --global "@warren-bank/hls-proxy"
```

#### How to: Run the server(s):

```bash
hlsd <options>

options:
========
--help
--version
--tls
--host <ip_address>
--port <number>
--req-headers <filepath>
--origin <header>
--referer <header>
--useragent <header>
--header <name=value>
--req-options <filepath>
--req-insecure
--req-secure-honor-server-cipher-order
--req-secure-ciphers <string>
--req-secure-protocol <string>
--req-secure-curve <string>
--hooks <filepath>
--prefetch
--max-segments <number>
--cache-timeout <number>
--cache-key <number>
-v <number>
--acl-whitelist <ip_address_list>
```

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
* _--req-headers_ is the filepath to a JSON data _Object_ containing key:value pairs
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
* _--req-options_ is the filepath to a JSON data _Object_
  * exposes the options _Object_ passed to low-level network request APIs:
    * [`http.request(options)`](https://nodejs.org/api/http.html#http_http_request_options_callback)
    * [`https.request(options)`](https://nodejs.org/api/https.html#https_https_request_options_callback)
  * advanced __https__ request options:
    * context of the secure request is obtained by passing the request options _Object_ to: [`tls.createSecureContext(options)`](https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options)
    * configuration for the context of the secure request can be merged with the request options _Object_
    * configuration keys of particular interest:
      * `honorCipherOrder`
        * default value: `false`
      * `ciphers`
        * default value: [`"ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA"`](https://nodejs.org/api/tls.html#tls_modifying_the_default_tls_cipher_suite)
      * `secureProtocol`
        * default value: [`"TLS_method"`](https://www.openssl.org/docs/man1.1.0/ssl/ssl.html#Dealing-with-Protocol-Methods)
      * `ecdhCurve`
        * default value: [`tls.DEFAULT_ECDH_CURVE`](https://nodejs.org/api/tls.html#tls_tls_default_ecdh_curve)
          * the exact value depends on the version of node
          * most commonly:
            * older versions of node: `"prime256v1"`
            * newer versions of node: `"auto"`
* _--req-insecure_ is a flag to override the following environment variable to disable certificate validation for secure __https__ requests:
  * [`NODE_TLS_REJECT_UNAUTHORIZED`](https://nodejs.org/api/cli.html#cli_node_tls_reject_unauthorized_value)`= 0`
    * equivalent to:
      * `curl --insecure`
      * `wget --no-check-certificate`
* _--req-secure-honor-server-cipher-order_ is a flag to set the following key in the request options _Object_ to configure the context for secure __https__ requests:
  * `{honorCipherOrder: true}`
* _--req-secure-ciphers_ is the value to assign to the following key in the request options _Object_ to configure the context for secure __https__ requests:
  * `{ciphers: value}`
* _--req-secure-protocol_ is the value to assign to the following key in the request options _Object_ to configure the context for secure __https__ requests:
  * `{secureProtocol: value}`
* _--req-secure-curve_ is the value to assign to the following key in the request options _Object_ to configure the context for secure __https__ requests:
  * `{ecdhCurve: value}`
* _--hooks_ is the filepath to a CommonJS module that exports a single JSON _Object_
  * each _key_ is the name of a hook function
  * each _value_ is the implementation of the corresponding _Function_
  * hook function signatures:
    * `"redirect": (url) => new_url`
      * conditionally redirect the URLs encountered in .m3u8 files __before__ they are modified to pass through the proxy
    * `"prefetch": (url) => boolean`
      * conditionally decide whether to prefetch video segments on a per-URL basis
      * return value must be a strict boolean type (ie: `true` or `false`)
      * otherwise, the default behavior supersedes
        - to only prefetch .ts files
    * `"prefetch_segments": (prefetch_urls, max_segments, is_vod, seg_duration_ms, perform_prefetch) => new_prefetch_urls`
      * conditionally filter the list of video segment URLs that are pending prefetch, when more than _--max-segments_ are contained in an HLS manifest
      * inputs:
        * `prefetch_urls`
          * array of string video segment URLs
        * `max_segments`
          * integer that denotes the max length of the return value
        * `is_vod`
          * boolean that indicates whether the HLS manifest is for video-on-demand
            * if true:
              * the video is not a live stream
              * the HLS manifest is complete and contains URLs for every video segment that would be needed to play the entire stream from start to finish
        * `seg_duration_ms`
          * integer that represents the duration (ms) of each video segment in the HLS manifest
        * `perform_prefetch`
          * function that accepts an array of string video segment URLs, and immediately begins to prefetch all corresponding segments
      * return value:
        * array of string video segment URLs that is a subset of `prefetch_urls`
          * can be emtpy (ex: when using `perform_prefetch`)
      * pre-conditions:
        * the length of `prefetch_urls` is &gt; `max_segments`
      * post-conditions:
        * the length of the return value array is &lt;= `max_segments`
* _--prefetch_ is a flag to enable the prefetch and caching of video segments
  * when .m3u8 files are downloaded and modified inflight, all of the URLs in the playlist are known
  * at this time, it is possible to prefetch the video segments (.ts files)
  * when the video segments (.ts files) are requested at a later time, the data is already cached (in memory) and can be returned immediately
* _--max-segments_ is the maximum number of video segments (.ts files) to hold in each cache
  * this option is only meaningful when _--prefetch_ is enabled
  * a cache is created for each unique HLS manifest URL
    - all of the video segments (.ts files) associated with each distinct video stream are stored in isolation
  * when any cache grows larger than this size, the oldest data is removed to make room to store new data
  * when this option is not specified:
    * default value: `20`
* _--cache-timeout_ is the maximum number of seconds that any segment cache can remain unused before its contents are cleared (to reduce wasted space in memory)
  * this option is only meaningful when _--prefetch_ is enabled
  * when this option is not specified:
    * default value: `60`
* _--cache-key_ sets the type of string used to represent keys in the cache hashtable when logged
  * this option is only meaningful when _--prefetch_ is enabled
  * scope:
    - v0.16.0 and earlier
      * keys in the cache hashtable used this string representation
    - v0.16.1 and later
      * keys in the cache hashtable are full URLs
        - the data structure to cache video segments (.ts files) was updated
        - each unique HLS manifest is associated with a distinct FIFO list that holds _--max-segments_
        - when a video segment is requested
          * the proxy needs to search every FIFO list for a match
          * when keys in the cache hashtable lose fidelity, collisions can occur and the wrong video segment can be returned
          * full URLs are unique and guarantee correct behavior
  * `0` (default):
    * sequence number of .ts file w/ .ts file extension (ex: "123.ts")
      * pros:
        * shortest type of string
        * makes the log output easiest to read
      * cons:
        * in the wild, I've encountered video servers that assign each .ts file a unique filename that always terminate with the same static sequence number
          * this is a strange edge case, but this option provides an easy workaround
  * `1`:
    * full filename of .ts file
  * `2`:
    * full URL of .ts file
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
* _--acl-whitelist_ restricts proxy server access to clients at IP addresses in whitelist
  * ex: `"192.168.1.100,192.168.1.101,192.168.1.102"`

#### Examples:

1. print help<br>
  `hlsd --help`

2. print version<br>
  `hlsd --version`

3. start HTTP proxy at default host:port<br>
  `hlsd`

4. start HTTP proxy at default host and specific port<br>
  `hlsd --port "8080"`

5. start HTTP proxy at specific host:port<br>
  `hlsd --host "192.168.0.100" --port "8080"`

6. start HTTPS proxy at default host:port<br>
  `hlsd --tls`

7. start HTTPS proxy at specific host:port<br>
  `hlsd --tls --host "192.168.0.100" --port "8081"`

8. start HTTPS proxy at default host:port and send specific HTTP headers<br>
  `hlsd --tls --req-headers "/path/to/request/headers.json"`

9. start HTTPS proxy at default host:port and enable prefetch of 10 video segments<br>
  `hlsd --tls --prefetch --max-segments 10`

- - - -

### Installation and Usage: Working with a Local `git` Repo

#### How to: Install:

```bash
git clone "https://github.com/warren-bank/HLS-Proxy.git"
cd "HLS-Proxy"
npm install
```

#### How to: Run the server(s):

```bash
# ----------------------------------------------------------------------
# If using a port number >= 1024 on Linux, or
# If using Windows:
# ----------------------------------------------------------------------
npm start [-- <options>]

# ----------------------------------------------------------------------
# https://www.w3.org/Daemon/User/Installation/PrivilegedPorts.html
#
# Linux considers port numbers < 1024 to be privileged.
# Use "sudo":
# ----------------------------------------------------------------------
npm run sudo [-- <options>]
```

#### Options:

* identical to the [command-line binary](#installation-and-usage-globally)

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

6. start HTTP proxy at specific port and send custom "Referer" request header for specific video stream<br>
  ```bash
npm start -- --port "8080"

h_referer='http://XXX:80/page.html'

URL='https://httpbin.org/headers'
URL="${URL}|${h_referer}"
URL=$(echo -n "$URL" | base64 --wrap=0)
URL="http://127.0.0.1:8080/${URL}.json"
# URL='http://127.0.0.1:8080/aHR0cHM6Ly9odHRwYmluLm9yZy9oZWFkZXJzfGh0dHA6Ly9YWFg6ODAvcGFnZS5odG1s.json'
curl --silent "$URL"
```

7. start HTTP proxy at specific port and send custom request headers<br>
  ```bash
headers_file="${TMPDIR}/headers.json"
echo '{"Origin" : "http://XXX:80", "Referer": "http://XXX:80/page.html"}' > "$headers_file"
npm start -- --port "8080" --req-headers "$headers_file"

URL='https://httpbin.org/headers'
URL=$(echo -n "$URL" | base64 --wrap=0)
URL="http://127.0.0.1:8080/${URL}.json"
# URL='http://127.0.0.1:8080/aHR0cHM6Ly9odHRwYmluLm9yZy9oZWFkZXJz.json'
curl --silent "$URL"
```

8. start HTTPS proxy at specific port and send custom request headers<br>
  ```bash
headers_file="${TMPDIR}/headers.json"
echo '{"Origin" : "http://XXX:80", "Referer": "http://XXX:80/page.html"}' > "$headers_file"
npm start -- --port "8081" --req-headers "$headers_file" --tls -v 1

URL='https://127.0.0.1:8081/aHR0cHM6Ly9odHRwYmluLm9yZy9oZWFkZXJz.json'
curl --silent --insecure "$URL"
```

9. start HTTPS proxy at specific port and send custom request headers<br>
  ```bash
h_origin='http://XXX:80'
h_referer='http://XXX:80/page.html'
h_useragent='Chromium'
h_custom_1='X-Foo: 123'
h_custom_2='X-Bar: baz'
npm start -- --port "8081" --origin "$h_origin" --referer "$h_referer" --useragent "$h_useragent" --header "$h_custom_1" --header "$h_custom_2" --tls -v 1

URL='https://127.0.0.1:8081/aHR0cHM6Ly9odHRwYmluLm9yZy9oZWFkZXJz.json'
curl --silent --insecure "$URL"
```

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

#### Summary of (Rarely) Observed OpenSSL Connection Errors:

* error:<br>
  `ssl3_check_cert_and_algorithm:dh key too small`
  1. attempted fix:<br>
     `--req-secure-ciphers "AES128-SHA"`

* error:<br>
  `SSL routines:SSL23_GET_SERVER_HELLO:sslv3 alert handshake failure`
  1. attempted fix:<br>
     `--req-secure-protocol "SSLv3_method"`
     * result:<br>
       `Error: SSLv3 methods disabled`
     * issue:
       * [node #3695](https://github.com/nodejs/node/issues/3695)
  2. attempted fix:<br>
     `--req-secure-curve "auto"`

- - - -

#### Other Projects:
##### (directly related, but very loosely coupled)

* [Webcast-Reloaded](https://github.com/warren-bank/crx-webcast-reloaded)
  * consists of 2 parts:
    1. a Chromium web browser extension (.crx)
       * on each browser tab, it's silently watching the URL of all outbound requests
       * every requested URL matching a regex pattern that identifies it to be a video file is displayed in the modal window that toggles open when the extension's icon is clicked
       * links in this modal window open to URLs of component &#35;2
    2. a static website
       * [there](https://warren-bank.github.io/crx-webcast-reloaded/external_website/index.html) is a selection of several HTML5 videos players
         * each is better at some things and worse at others
         * each integrates with a different Chromecast receiver app
       * [there](https://warren-bank.github.io/crx-webcast-reloaded/external_website/proxy.html) is a page to help redirect the intercepted video URL through a local instance of _HLS Proxy_

- - - -

#### Other Projects:
##### (unrelated, but somewhat similar in scope and purpose)

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
  * usage test result:
    * [doesn't appear to work with HTML5 video players or Chromecast](https://github.com/streamlink/streamlink/issues/1704#issuecomment-413661578)
    * the server starts and works as it was intended, but something about the format of the data it "streams" is incompatible
    * [VLC](https://portableapps.com/apps/music_video/vlc_portable) can play the video stream from the server, and be used to [render the video on Chromecast](https://github.com/warren-bank/HLS-Proxy/blob/master/.related/.recipes/01.%20Streamlink/notes.txt)

- - - -

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
