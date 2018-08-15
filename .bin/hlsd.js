#! /usr/bin/env node

if ( (process.argv.length > 2) && (process.argv[2].toLowerCase().replace(/[^a-z]/g, '') === "help") ) {
  console.log(`
usage examples:
===============
1) start HTTP proxy at default host:ip [localhost:80]
     hlsd
2) start HTTP proxy at specific host:ip
     hlsd "192.168.0.100" "8080"
3) start HTTPS proxy at default host:ip [localhost:443]
     hlsd "" "" tls
4) start HTTPS proxy at specific host:ip
     hlsd "192.168.0.100" "8080" tls
` )
  process.exit(0)
}

let start_server
if ( (process.argv.length > 4) && (process.argv[4].toLowerCase().replace(/[^a-z]/g, '') === "tls") ) {
  start_server = require('../bin/start_https')
}
else {
  start_server = require('../bin/start_http')
}
start_server(process.argv[2], Number(process.argv[3]))
