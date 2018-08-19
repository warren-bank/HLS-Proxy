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

const proxy = function(server, host, port, is_secure, req_headers, debug_level) {
  debug_level = debug_level || 0

  const debug = function() {
    let args      = [...arguments]
    let verbosity = args.shift()

    if (debug_level >= verbosity) {
      console.log.apply(console.log, args)
    }
  }

  const regexs = {
    wrap: new RegExp('/?([^\\.]+)(?:\\..*)?$', 'i'),
    m3u8: new RegExp('\\.m3u8$', 'i'),
//  urls: new RegExp('(^)(https?://(?:[^/\\s,\'"]*/)+)?([^/\\s,\'"]+)(\\.[^/\\.\\s,\'"]+)($)', 'img'),
//  urls: new RegExp('(^|[\\s\'"])(https?://(?:[^/\\s,\'"]*/)+)?([^/\\s,\'"]+)(\\.[^/\\.\\s,\'"]+)(["\'\\s]|$)', 'img'),
//  urls: new RegExp('(^|[\\s\'"])(https?://(?:[^/\\s,\'"]*/)+)?([^/\\s,\'"]+)(\\.[^/\\.\\s,\'"]+)?(["\'\\s]|$)', 'img'),
//  urls: new RegExp('(^|[\\s\'"])((?:https?://)?(?:[^/\\s,\'"]*/)+)?([^/\\s,\'"]+)(\\.[^/\\.\\s,\'"]+)?(["\'\\s]|$)', 'img'),
//  urls: new RegExp('(^|[\\s\'"])((?:https?:/)?/(?:[^/\\s,\'"]*/)+)?([^/\\s,\'"]+)(\\.[^/\\.\\s,\'"]+)?(["\'\\s]|$)', 'img'),
    urls: new RegExp('(^|[\\s\'"])((?:https?:/)?/(?:[^/\\s,\'"]*/)+)?([^/\\s,\'"]+?)(\\.[^/\\.\\s,\'"]+)?(["\'\\s]|$)', 'img'),
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
    const base_urls = {
      "relative": m3u8_url.replace(/[^\/]+$/, ''),
      "absolute": m3u8_url.replace(/(:\/\/[^\/]+).*$/, '$1')
    }

    m3u8_content = m3u8_content.replace(regexs.urls, function(match, head, abs_path, file_name, file_ext, tail) {
      debug(2, 'modify raw:', {match, head, abs_path, file_name, file_ext, tail})

      if (!abs_path && !file_ext) return match

      let matching_url
      if (!abs_path) {
        matching_url = `${base_urls.relative}${file_name}${file_ext || ''}`
      }
      else if (abs_path[0] === '/') {
        matching_url = `${base_urls.absolute}${abs_path}${file_name}${file_ext || ''}`
      }
      else {
        matching_url = `${abs_path}${file_name}${file_ext || ''}`
      }
      debug(1, 'modify:', matching_url)

      return `${head}${ is_secure ? 'https' : 'http' }://${host}:${port}/${ base64_encode(matching_url) }${file_ext || ''}${tail}`
    })

    m3u8_content = m3u8_content.replace(regexs.keys, function(match, head, key_url, tail) {
      debug(1, 'key:', key_url)

    //return ''
    //return `${head}${'http://192.168.1.254:80/1534621801'}${tail}`
      return `${head}${key_url}${tail}`
    })

    return m3u8_content
  }

  // Create an HTTP tunneling proxy
  server.on('request', (req, res) => {
    debug(2, 'proxying raw:', req.url)

    const url     = base64_decode( req.url.replace(regexs.wrap, '$1') )
    const is_m3u8 = regexs.m3u8.test(url)
    const options = get_request_options(url)
    debug(1, 'proxying:', url)

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
      debug(0, e.message)
      res.writeHead(500, e.message)
      res.end()
    })
  })
}

module.exports = proxy
