@echo off

rem :: https://github.com/fatedier/frp
rem :: https://github.com/fatedier/frp/releases/tag/v0.35.1
set frp_HOME=C:\PortableApps\frp\0.35.1

set PATH=%frp_HOME%;%PATH%

set FRP_SERVER_ADDR=my-domain
set FRP_SERVER_PORT=7000
set FRP_SERVER_DASHBOARD_PORT=7500
set FRP_SERVER_HTTP_PORT=9090

set FRP_CLIENT_DASHBOARD_IP=127.0.0.1
set FRP_CLIENT_DASHBOARD_PORT=7400

set HLS_PROXY_NETWORK_PROTOCOL=http
set HLS_PROXY_LOCAL_IP=127.0.0.1
set HLS_PROXY_LOCAL_PORT=8080
set HLS_PROXY_REMOTE_SUBDOMAIN=hls-proxy
