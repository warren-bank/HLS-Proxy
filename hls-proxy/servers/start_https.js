const resolve = require('./lib/LAN_IPs').resolve
const proxy   = require('../proxy')
const https   = require('https')
const fs      = require('fs')

const start_server = function({host, port, req_headers, req_options, hooks, cache_segments, max_segments, cache_timeout, cache_key, verbosity, acl_whitelist}) {
  if (!port || isNaN(port)) port = 443

  resolve(host, port)
  .then((host) => {
    // reference:
    //   https://aghassi.github.io/ssl-using-express-4/

    const ssl_options = {
      key:  fs.readFileSync(`${__dirname}/cert/key.pem`),
      cert: fs.readFileSync(`${__dirname}/cert/cert.pem`),
      passphrase: 'HLS-proxy'
    }

    const server = https.createServer(ssl_options)
    proxy({server, host, is_secure: true, req_headers, req_options, hooks, cache_segments, max_segments, cache_timeout, cache_key, debug_level: verbosity, acl_whitelist})
    server.listen(port, function () {
      console.log(`HTTPS server is listening at: ${host}`)
    })
  })
}

module.exports = start_server
