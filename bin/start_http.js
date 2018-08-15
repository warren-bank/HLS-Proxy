const proxy = require('../proxy')
const http  = require('http')

let host = 'localhost'
let port = 80
if (process.argv.length > 3) {
  try {
    if (process.argv[2]) host = process.argv[2]
    if (process.argv[3]) port = Number(process.argv[3])
  }
  catch(e){}
}

const server = http.createServer()
proxy(server, host, port, false)
server.listen(port, function () {
  console.log('HTTP server is listening on port ' + port)
})
