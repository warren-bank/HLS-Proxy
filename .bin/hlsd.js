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

if ( (process.argv.length > 4) && (process.argv[4].toLowerCase().replace(/[^a-z]/g, '') === "tls") ) {
  require('../bin/start_https')
}
else {
  require('../bin/start_http')
}
