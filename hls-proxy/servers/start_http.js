const prompt = require('./lib/LAN_IPs').prompt
const proxy  = require('../proxy')
const http   = require('http')

const start_server = function(host, port, req_headers, cache_segments, max_segments, verbosity) {
  if (!port || isNaN(port)) port = 80

  new Promise((resolve, reject) => {
    if (host) return resolve(host)

    prompt((host) => resolve(host))
  })
  .then((host) => {
    if (host === false) {
      host = 'localhost'
    }

    const server = http.createServer()
    proxy(server, host, port, false, req_headers, cache_segments, max_segments, verbosity)
    server.listen(port, function () {
      console.log(`HTTP server is listening at: ${host}:${port}`)
    })
  })
}

module.exports = start_server
