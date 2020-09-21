const prompt = require('./lib/LAN_IPs').prompt
const proxy  = require('../proxy')
const https  = require('https')
const fs     = require('fs')

const start_server = function({host, port, req_headers, req_options, hooks, cache_segments, max_segments, cache_timeout, cache_key, verbosity, acl_whitelist}) {
  if (!port || isNaN(port)) port = 443

  new Promise((resolve, reject) => {
    if (host) return resolve(host)

    prompt((host) => resolve(host))
  })
  .then((host) => {
    if (host === false) {
      host = 'localhost'
    }

    // reference:
    //   https://aghassi.github.io/ssl-using-express-4/

    const ssl_options = {
      key:  fs.readFileSync(`${__dirname}/cert/key.pem`),
      cert: fs.readFileSync(`${__dirname}/cert/cert.pem`),
      passphrase: 'HLS-proxy'
    }

    const server = https.createServer(ssl_options)
    proxy({server, host, port, is_secure: true, req_headers, req_options, hooks, cache_segments, max_segments, cache_timeout, cache_key, debug_level: verbosity, acl_whitelist})
    server.listen(port, function () {
      console.log(`HTTPS server is listening at: ${host}:${port}`)
    })
  })
}

module.exports = start_server
