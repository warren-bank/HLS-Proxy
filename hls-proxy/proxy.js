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

const proxy = function(server, host, port, is_secure, req_headers, debug_level, error_handler) {

// ----------------------------------------------------------------------------- livecamtv.me:
const url_pattern = new RegExp('^(https?://e)(\\d+)(\\..+)$')
const max_subdomain_index = 20
let current_subdomain_index

error_handler = function(url, is_m3u8, most_recent_m3u8_url) {
  let retry_url

  if (url_pattern.test(url)) {
    retry_url = url.replace(url_pattern, (match, $1, $2, $3) => {
      let subdomain_index = Number($2)
      if (isNaN(subdomain_index)) return false

      if (current_subdomain_index === undefined) current_subdomain_index = subdomain_index

      if (current_subdomain_index === subdomain_index) {
        subdomain_index = (subdomain_index + 1) % max_subdomain_index
        subdomain_index = (subdomain_index === 0) ? max_subdomain_index : subdomain_index
        current_subdomain_index = subdomain_index
      }
      else {
        subdomain_index = current_subdomain_index
      }

      return $1 + subdomain_index + $3
    })
  }
  return retry_url
}
// -----------------------------------------------------------------------------

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
      debug(1, 'redirecting:', matching_url)

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

  let most_recent_m3u8_url

  const max_errors = 5

  const process_request = function(url, res, error_counter) {
    const is_m3u8 = regexs.m3u8.test(url)
    const options = get_request_options(url)
    debug(1, (error_counter === 0 ? 'proxying:' : 'retrying:'), url)

    if (is_m3u8) most_recent_m3u8_url = url

    return request(options, '', {binary: !is_m3u8, stream: !is_m3u8})
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
      if (typeof error_handler !== 'function') throw e

      error_counter++
      if (error_counter > max_errors) throw e

      return new Promise((resolve, reject) => {
        const retry_url = error_handler(url, is_m3u8, most_recent_m3u8_url)

        if (!retry_url) {
          reject(e)
        }
        else {
          resolve( process_request(retry_url, res, error_counter) )
        }
      })
    })
    .catch((e) => {
      debug(0, e.message)
      res.writeHead(500, e.message)
      res.end()
    })
  }

  // Create an HTTP tunneling proxy
  server.on('request', (req, res) => {
    debug(3, 'proxying (raw):', req.url)

    const url = base64_decode( req.url.replace(regexs.wrap, '$1') )
    add_CORS_headers(res)
    process_request(url, res, 0)
  })
}

module.exports = proxy
