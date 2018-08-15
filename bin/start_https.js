const prompt = require('../lib/LAN_IPs').prompt
const proxy  = require('../proxy')
const https  = require('https')
const fs     = require('fs')

const start_server = function(host, port) {
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
      key:  fs.readFileSync(`${__dirname}/../cert/key.pem`),
      cert: fs.readFileSync(`${__dirname}/../cert/cert.pem`),
      passphrase: 'HLS-proxy'
    }

    const server = https.createServer(ssl_options)
    proxy(server, host, port, true)
    server.listen(port, function () {
      console.log(`HTTPS server is listening at: ${host}:${port}`)
    })
  })
}

if (require.main === module) {
  start_server(process.argv[2], Number(process.argv[3]))
} else {
  module.exports = start_server
}
