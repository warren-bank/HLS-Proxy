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
hlsd --help

hlsd [--tls] [--host "127.0.0.1"] [--port "80"] [--req-headers "/path/to/request/headers.json"]
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
  `hlsd --host "192.168.0.100" --port "8081" --tls`

7. start HTTPS proxy at default host:port and send specific HTTP headers<br>
  `hlsd --tls --req-headers "/path/to/request/headers.json"`

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
# https://www.w3.org/Daemon/User/Installation/PrivilegedPorts.html
#
# Linux considers port numbers < 1024 to be priviliged.
# Use "sudo":
# ----------------------------------------------------------------------
npm run sudo-http  [-- [--host "127.0.0.1"] [--port  "80"] [--req-headers "/path/to/request/headers.json"] ]
npm run sudo-https [-- [--host "127.0.0.1"] [--port "443"] [--req-headers "/path/to/request/headers.json"] ]

# ----------------------------------------------------------------------
# If using a port number >= 1024 on Linux, or
# If using Windows:
# ----------------------------------------------------------------------
npm run http  [-- [--host "127.0.0.1"] [--port  "80"] [--req-headers "/path/to/request/headers.json"] ]
npm run https [-- [--host "127.0.0.1"] [--port "443"] [--req-headers "/path/to/request/headers.json"] ]
```

#### Examples:

```bash
npm run http  -- --host "192.168.0.100" --port "8080"

npm run https -- --host "192.168.0.100" --port "8081"
```

#### Options:

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

#### Legal:

* copyright: [Warren Bank](https://github.com/warren-bank)
* license: [GPL-2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt)
