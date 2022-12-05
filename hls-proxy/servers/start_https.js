const https = require('https')
const fs    = require('fs')

const start_server = function({port, tls_cert, tls_key, tls_pass}) {
  if (!port || isNaN(port)) port = 443

  const ssl_options = (tls_cert && tls_key)
    ? {
        cert:       fs.readFileSync(tls_cert),
        key:        fs.readFileSync(tls_key),
        passphrase: tls_pass ? fs.readFileSync(tls_pass, 'utf8') : ''
      }
    : {
        cert:       fs.readFileSync(`${__dirname}/cert/cert.pem`),
        key:        fs.readFileSync(`${__dirname}/cert/key.pem`),
        passphrase: 'HLS-proxy'
      }

  const server = https.createServer(ssl_options)

  server.listen(port, function () {
    console.log(`HTTPS server is listening on port: ${port}`)
  })

  return server
}

module.exports = start_server
