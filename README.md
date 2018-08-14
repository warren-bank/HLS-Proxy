### [HTTP Live Streaming Proxy](https://github.com/warren-bank/HLS-proxy)

#### Intended Purpose:

* proxy .m3u8 files, and the .ts files they internally reference
* to all:
  * remove CORS response headers
* to .m3u8:
  * modify contents such that URLs to .ts files will also pass through the proxy

- - - -

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
npm run sudo-http  [-- <host=127.0.0.1> <port=80> ]
npm run sudo-https [-- <host=127.0.0.1> <port=443>]

# ----------------------------------------------------------------------
# If using a port number >= 1024 on Linux, or
# If using Windows:
# ----------------------------------------------------------------------
npm run http  [-- <host=127.0.0.1> <port=80> ]
npm run https [-- <host=127.0.0.1> <port=443>]
```

#### Example:

```bash
npm run http -- "192.168.0.100" "8080"
```

#### Options:

* _host_ should be the IP address of the server on the LAN
  * ex: `192.168.0.100` ..so Chromecast can proxy requests through it
  * only used to modify .ts URLs in .m3u8 files
* _port_ is the port number that the server listens on
  * ex: `8080`
  * also used to modify .ts URLs in .m3u8 files

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
