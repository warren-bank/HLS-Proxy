const resolve = require('./lib/LAN_IPs').resolve
const proxy   = require('../proxy')
const http    = require('http')

const start_server = function({host, port, req_headers, req_options, hooks, cache_segments, max_segments, cache_timeout, cache_key, verbosity, acl_whitelist}) {
  if (!port || isNaN(port)) port = 80

  resolve(host, port)
  .then((host) => {
    const server = http.createServer()
    proxy({server, host, is_secure: false, req_headers, req_options, hooks, cache_segments, max_segments, cache_timeout, cache_key, debug_level: verbosity, acl_whitelist})
    server.listen(port, function () {
      console.log(`HTTP server is listening at: ${host}`)
    })
  })
}

module.exports = start_server
