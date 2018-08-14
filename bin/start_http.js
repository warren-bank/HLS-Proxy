const proxy = require('../proxy')
const http  = require('http')

let host = 'localhost'
let port = 80
if (process.argv.length > 3) {
  try {
    host = process.argv[2]
    port = Number(process.argv[3])
  }
  catch(e){}
}

const server = http.createServer()
proxy(server, host, port, false)
server.listen(port, function () {
  console.log('HTTP server is listening on port ' + port)
})
