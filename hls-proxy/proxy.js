const request   = require('@warren-bank/node-request').request
const parse_url = require('url').parse

// btoa
const base64_encode = function(str) {
  return Buffer.from(str, 'binary').toString('base64')
}

// atob
const base64_decode = function(str) {
  return Buffer.from(str, 'base64').toString('binary')
}

const proxy = function(server, host, port, is_secure, req_headers) {
  const regexs = {
    wrap: new RegExp('/?([^\\.]+)(?:\\..*)?$', 'i'),
    m3u8: new RegExp('\\.m3u8$', 'i'),
//  urls: new RegExp('(^|[\\s\'"])(https?://(?:[^/\\s,\'"]*/)+)?([^/\\s,\'"]+)(\\.[^/\\.\\s,\'"]+)(["\'\\s]|$)', 'img'),
    urls: new RegExp('(^)(https?://(?:[^/\\s,\'"]*/)+)?([^/\\s,\'"]+)(\\.[^/\\.\\s,\'"]+)($)', 'img'),
    keys: new RegExp('(^#EXT-X-KEY:[^"]*")([^"]+)(".*$)', 'img')
  }

  const add_CORS_headers = function(res) {
    res.setHeader('Access-Control-Allow-Origin',      '*')
    res.setHeader('Access-Control-Allow-Methods',     '*')
    res.setHeader('Access-Control-Allow-Headers',     '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age',           '86400')
  }

  const get_request_options = function(url) {
    if (!req_headers) return url

    let request_options = Object.assign(
      {},
      parse_url(url),
      {headers: req_headers}
    )
    return request_options
  }

  const modify_m3u8_content = function(m3u8_content, m3u8_url) {
    const base_url = m3u8_url.replace(/[^\/]+$/, '')

    m3u8_content = m3u8_content.replace(regexs.urls, function(match, head, abs_path, file_name, file_ext, tail) {
      return `${head}${ is_secure ? 'https' : 'http' }://${host}:${port}/${ base64_encode(`${abs_path || base_url}${file_name}${file_ext}`) }${file_ext}${tail}`
    })

    m3u8_content = m3u8_content.replace(regexs.keys, function(match, head, key_url, tail) {
      console.log('key:', key_url)

    //return ''
    //return `${head}${'http://192.168.1.254:80/1534621801'}${tail}`
      return `${head}${key_url}${tail}`
    })

    return m3u8_content
  }

  // Create an HTTP tunneling proxy
  server.on('request', (req, res) => {
    const url     = base64_decode( req.url.replace(regexs.wrap, '$1') )
    const is_m3u8 = regexs.m3u8.test(url)
    const options = get_request_options(url)
    console.log('proxying:', url)

    add_CORS_headers(res)

    request(options, '', {binary: !is_m3u8, stream: !is_m3u8})
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
