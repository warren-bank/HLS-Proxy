const request   = require('@warren-bank/node-request').request

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
    urls: new RegExp('(^|[\\s\'"])(https?://(?:[^/\\s,\'"]*/)+)?([^/\\s,\'"]+)(\\.[^/\\.\\s,\'"]+)(["\'\\s]|$)', 'ig')
  }

  const add_CORS_headers = function(res) {
    res.setHeader('Access-Control-Allow-Origin',      '*')
    res.setHeader('Access-Control-Allow-Methods',     '*')
    res.setHeader('Access-Control-Allow-Headers',     '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age',           '86400')
  }

  const modify_m3u8_content = function(m3u8_content, referer) {
    const base_url = referer.replace(/[^\/]+$/, '')

    return m3u8_content.replace(regexs.urls, function(match, head, abs_path, file_name, file_ext, tail) {
      return `${head}${ is_secure ? 'https' : 'http' }://${host}:${port}/${ base64_encode(`${abs_path || base_url}${file_name}${file_ext}`) }${file_ext}${tail}`
    })
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
        res.writeHead(200, { "Content-Type": "application/x-mpegURL" })
        res.end( modify_m3u8_content(response, url) )
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
