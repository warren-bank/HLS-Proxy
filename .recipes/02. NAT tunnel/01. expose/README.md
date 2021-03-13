This recipe outlines how to access _HLS Proxy_ on a public network using [expose](https://github.com/beyondcode/expose).

_expose_ is:
* an open-source alternative to [ngrok](https://ngrok.com/product)
* written entirely in PHP
  - which should make it easy to find cheap/free hosting

- - - -

Summary of network without any additional tunnel:
* client makes request to _HLS Proxy_
  - _HLS Proxy_ makes request to video-host
  - _HLS Proxy_ sends content of video stream to client

Summary of network with [expose](https://github.com/beyondcode/expose) tunnel:
* _expose server_ runs on machine having a static IP and is configured to be accessed from a public network (ex: the internet)
* _expose client_ runs on the same machine as _HLS Proxy_
  - it creates a tunnel through NAT on the local/private network
  - it can be configured such that:
    * all URLs requested from a specific subdomain on the _expose server_ are sent through the tunnel to the _expose client_
    * the _expose client_ proxies the request to another server that can be accessed on the local/private network
      - for example: _HLS Proxy_ at `localhost:8080`
* client makes request to static subdomain on the _expose server_
  - _expose server_ makes request through tunnel to _expose client_
    * _expose client_ makes request to _HLS Proxy_
      - _HLS Proxy_ makes request to video-host
      - _HLS Proxy_ sends content of video stream to _expose client_
    * _expose client_ sends content of video stream (back) through tunnel to _expose server_
  - _expose server_ sends content of video stream to client

- - - -

Dependencies:
* PHP 4.3+
  - loadable extensions:
    * sqlite3
* expose [PHP archive](https://www.php.net/manual/en/intro.phar.php)

Versions of dependencies used to test:
* PHP 7.4.15
* [expose-1.5.1.phar](https://github.com/beyondcode/expose/raw/1.5.1/builds/expose)

[Usage](https://beyondco.de/docs/expose/introduction):
```bash
  php expose-1.5.1.phar <options>
```
