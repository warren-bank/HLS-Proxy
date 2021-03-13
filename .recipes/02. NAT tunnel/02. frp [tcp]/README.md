This recipe outlines how to access _HLS Proxy_ on a public network using [frp](https://github.com/fatedier/frp).

_frp_ is:
* an open-source alternative to [ngrok](https://ngrok.com/product)
  - very stable
  - loaded with nice features
* written entirely in Golang
  - releases include statically compiled binaries for nearly all operating systems and hardware architectures

- - - -

Summary of network without any additional tunnel:
* client makes request to _HLS Proxy_
  - _HLS Proxy_ makes request to video-host
  - _HLS Proxy_ sends content of video stream to client

Summary of network with [frp](https://github.com/fatedier/frp) tunnel:
* _frp server_ runs on machine having a static IP and is configured to be accessed from a public network (ex: the internet)
* _frp client_ runs on the same machine as _HLS Proxy_
  - it creates a tunnel through NAT on the local/private network
  - it can be configured such that:
    * all _tcp_ traffic directed to a specific port number on the _frp server_ is sent through the tunnel to the _frp client_
    * the _frp client_ proxies the _tcp_ traffic to another server that can be accessed on the local/private network
      - for example: _HLS Proxy_ at `localhost:8080`
* client makes request to specific port number on the _frp server_
  - _frp server_ makes request through tunnel to _frp client_
    * _frp client_ makes request to _HLS Proxy_
      - _HLS Proxy_ makes request to video-host
      - _HLS Proxy_ sends content of video stream to _frp client_
    * _frp client_ sends content of video stream (back) through tunnel to _frp server_
  - _frp server_ sends content of video stream to client

- - - -

Dependencies:
* [frp](https://github.com/fatedier/frp) binaries:
  - `frps.exe` server
  - `frpc.exe` client

Versions of dependencies used to test:
* [frp 0.35.1](https://github.com/fatedier/frp/releases/tag/v0.35.1)
