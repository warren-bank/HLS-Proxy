const proxy = require('../proxy')
const https = require('https')
const fs    = require('fs')

let host = 'localhost'
let port = 443
if (process.argv.length > 3) {
  try {
    if (process.argv[2]) host = process.argv[2]
    if (process.argv[3]) port = Number(process.argv[3])
  }
  catch(e){}
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
  console.log('HTTPS server is listening on port ' + port)
})
