const request   = require('@warren-bank/node-request').request
const url_parse = require('url').parse

// btoa
const base64_encode = function(str) {
  return Buffer.from(str, 'binary').toString('base64')
}

// atob
const base64_decode = function(str) {
  return Buffer.from(str, 'base64').toString('binary')
}

const proxy = function(server, host, port, is_secure) {
  const regexs = {
    wrap: new RegExp('/?([^\\.]+)\\..*$', 'i'),
    m3u8: new RegExp('\\.m3u8$', 'i'),
    ts:   new RegExp('(https?://[^\\s]+\\.ts)(\\s|$)', 'ig')
  }

  const add_CORS_headers = function(res) {
    res.setHeader('Access-Control-Allow-Origin',      '*')
    res.setHeader('Access-Control-Allow-Methods',     '*')
    res.setHeader('Access-Control-Allow-Headers',     '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age',           '86400')
  }

  // Create an HTTP tunneling proxy
  server.on('request', (req, res) => {
    const url     = base64_decode( req.url.replace(regexs.wrap, '$1') )
    const is_m3u8 = regexs.m3u8.test(url)
    console.log('proxying:', url)

    add_CORS_headers(res)

    request(url, '', {binary: !is_m3u8, stream: !is_m3u8})
    .then(({response}) => {
      if (!is_m3u8) {
        response.pipe(res)
      }
      else {
        response = response.replace(regexs.ts, (match, p1, p2) => `${ is_secure ? 'https' : 'http' }://${host}:${port}/${ base64_encode(p1) }.ts${p2}`)
        res.writeHead(200, { "Content-Type": "application/x-mpegURL" })
        res.end(response)
      }
    })
    .catch((e) => {
      console.log(e.message)
      res.writeHead(500, e.message)
      res.end()
    })
  })
}

module.exports = proxy
