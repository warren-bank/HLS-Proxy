const segment_cache = require('./segment_cache')
const request       = require('@warren-bank/node-request').request
const parse_url     = require('url').parse

// btoa
const base64_encode = function(str) {
  return Buffer.from(str, 'binary').toString('base64')
}

// atob
const base64_decode = function(str) {
  return Buffer.from(str, 'base64').toString('binary')
}

const proxy = function(server, host, port, is_secure, req_headers, cache_segments, max_segments, debug_level) {
  debug_level  = debug_level  ||  0
  max_segments = max_segments || 20

  const debug = function() {
    let args      = [...arguments]
    let verbosity = args.shift()

    if (debug_level >= verbosity) {
      console.log.apply(console.log, args)
    }
  }

  const regexs = {
    wrap: new RegExp('/?([^\\.]+)(?:\\..*)?$', 'i'),
    m3u8: new RegExp('\\.m3u8(?:[\\?#]|$)', 'i'),
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

  let prefetch_segment, get_segment
  if (cache_segments) {(
    {prefetch_segment, get_segment} = segment_cache({debug, request, get_request_options, max_segments})
  )}

  const modify_m3u8_content = function(m3u8_content, m3u8_url) {
    const base_urls = {
      "relative": m3u8_url.replace(/[^\/]+$/, ''),
      "absolute": m3u8_url.replace(/(:\/\/[^\/]+).*$/, '$1')
    }

    if (debug_level >= 1) {
      m3u8_content = m3u8_content.replace(regexs.keys, function(match, head, key_url, tail) {
        debug(1, 'key:', key_url)
        return match
      })
    }

    m3u8_content = m3u8_content.replace(regexs.urls, function(match, head, abs_path, file_name, file_ext, tail) {
      debug(3, 'modify (raw):', {match, head, abs_path, file_name, file_ext, tail})

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
      matching_url = matching_url.trim()
      debug(1, 'redirecting:', matching_url)

      if (cache_segments) {
        prefetch_segment(matching_url)
      }

      let redirected_url = `${ is_secure ? 'https' : 'http' }://${host}:${port}/${ base64_encode(matching_url) }${file_ext || ''}`
      debug(2, 'redirecting (proxied):', redirected_url)

      return `${head}${redirected_url}${tail}`
    })

    if (debug_level >= 2) {
      m3u8_content = m3u8_content.replace(regexs.keys, function(match, head, key_url, tail) {
        debug(2, 'key (proxied):', key_url)
        return match
      })
    }

    return m3u8_content
  }

  // Create an HTTP tunneling proxy
  server.on('request', (req, res) => {
    debug(3, 'proxying (raw):', req.url)

    add_CORS_headers(res)

    const url     = base64_decode( req.url.replace(regexs.wrap, '$1') ).trim()
    const is_m3u8 = regexs.m3u8.test(url)

    if (cache_segments && !is_m3u8) {
      let segment = get_segment(url)  // Buffer or undefined

      if (segment && segment.length) {
        res.writeHead(200, { "Content-Type": "video/MP2T" })
        res.end(segment)
        return
      }
    }

    const options = get_request_options(url)
    debug(1, 'proxying:', url)
    debug(3, 'm3u8:', (is_m3u8 ? 'true' : 'false'))

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
