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

const proxy = function({server, host, port, is_secure, req_headers, req_options, hooks, cache_segments, max_segments, cache_timeout, cache_key, debug_level, acl_whitelist}) {

  const debug = function() {
    let args      = [...arguments]
    let verbosity = args.shift()
    let append_LF = true

    if (append_LF) args.push("\n")

    if (debug_level >= verbosity) {
      console.log.apply(console.log, args)
    }
  }

  const regexs = {
    wrap: new RegExp('/?([^\\._]+)(?:[\\._].*)?$', 'i'),
    m3u8: new RegExp('\\.m3u8(?:[\\?#]|$)', 'i'),
    ts:   new RegExp('\\.ts(?:[\\?#]|$)', 'i'),
//  urls: new RegExp('(^|[\\s\'"])((?:https?:/)?/)?((?:[^/\\s,\'"]*?/)+)?([^/\\s,\'"]+?)(\\.[^/\\.\\s,\'"]+)?(["\'\\s]|$)', 'img'),
    urls: new RegExp('(^|[\\s\'"])((?:https?:/)?/)?((?:[^\\?#,/\\s\'"]*/)+?)?([^\\?#,/\\s\'"]+?)(\\.[^\\?#,/\\.\\s\'"]+(?:[\\?#][^\\s\'"]*)?)?([\\s\'"]|$)', 'img'),
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
    if (!req_headers && !req_options) return url

    let request_options = Object.assign(
      {},
      parse_url(url),
      {headers: (req_headers || {})},
      (req_options || {})
    )
    return request_options
  }

  const should_prefetch_url = function(url) {
    let do_prefetch = !!cache_segments

    if (do_prefetch) {
      do_prefetch = regexs.ts.test(url)

      if (hooks && (hooks instanceof Object) && hooks.prefetch && (typeof hooks.prefetch === 'function')) {
        const override_prefetch = hooks.prefetch(url)

        if ((typeof override_prefetch === 'boolean') && (override_prefetch !== do_prefetch)) {
          debug(3, 'prefetch override:', (override_prefetch ? 'allow' : 'deny'), url)
          do_prefetch = override_prefetch
        }
      }
    }
    return do_prefetch
  }

  let prefetch_segment, get_segment, add_listener
  if (cache_segments) {(
    {prefetch_segment, get_segment, add_listener} = require('./segment_cache')({should_prefetch_url, debug, debug_level, request, get_request_options, max_segments, cache_timeout, cache_key})
  )}

  const modify_m3u8_content = function(m3u8_content, m3u8_url) {
    const base_urls = {
      "relative": m3u8_url.replace(/[\?#].*$/, '').replace(/[^\/]+$/, ''),
      "absolute": m3u8_url.replace(/(:\/\/[^\/]+).*$/, '$1')
    }

    if (debug_level >= 2) {
      m3u8_content = m3u8_content.replace(regexs.keys, function(match, head, key_url, tail) {
        debug(2, 'key:', key_url)
        return match
      })
    }

    const ts_regexs = {
      "file_ext": /^\.ts/i,
      "sequence_number": /[^\d](\d+)$/i
    }

    const get_ts_file_ext = function(file_name, file_ext) {
      let ts_file_ext, matches

      if (ts_regexs["file_ext"].test(file_ext)) {
        matches = ts_regexs["sequence_number"].exec(file_name)
        if (matches && matches.length) {
          ts_file_ext = `_${matches[1]}${file_ext}`
        }
      }
      return ts_file_ext
    }

    const prefetch_urls = []

    m3u8_content = m3u8_content.replace(regexs.urls, function(match, head, abs_path, rel_path, file_name, file_ext, tail) {
      if (
        ((head === `"`) || (head === `'`) || (tail === `"`) || (tail === `'`)) &&
        (head !== tail)
      ) return match

      if (
        !abs_path && (
             (!file_ext)
          || ( rel_path && ( rel_path.indexOf('#EXT') === 0))
          || (!rel_path && (file_name.indexOf('#EXT') === 0))
        )
      ) return match

      debug(3, 'modify (raw):', {match, head, abs_path, rel_path, file_name, file_ext, tail})

      let matching_url
      if (!abs_path) {
        matching_url = `${base_urls.relative}${rel_path || ''}${file_name}${file_ext || ''}`
      }
      else if (abs_path[0] === '/') {
        matching_url = `${base_urls.absolute}${abs_path}${rel_path || ''}${file_name}${file_ext || ''}`
      }
      else {
        matching_url = `${abs_path}${rel_path || ''}${file_name}${file_ext || ''}`
      }
      matching_url = matching_url.trim()

      if (hooks && (hooks instanceof Object) && hooks.redirect && (typeof hooks.redirect === 'function')) {
        debug(3, 'redirecting (pre-hook):', matching_url)

        try {
          let result = hooks.redirect(matching_url)

          if (result) {
            if (typeof result === 'string') {
              matching_url = result
            }
            else if (result instanceof Object) {
              if (result.matching_url) matching_url = result.matching_url
              if (result.file_name)    file_name    = result.file_name
              if (result.file_ext)     file_ext     = result.file_ext
            }
          }

          if (typeof matching_url !== 'string') throw new Error('bad return value')

          if (matching_url.length && matching_url.toLowerCase().indexOf('http') !== 0) {
            matching_url = ( (matching_url[0] === '/') ? base_urls.absolute : base_urls.relative ) + matching_url
          }
        }
        catch(e) {
          matching_url = ''
        }

        if (!matching_url) {
          debug(3, 'redirecting (post-hook):', 'URL filtered, removed from manifest')
          return `${head}${tail}`
        }
      }
      debug(2, 'redirecting:', matching_url)

      // aggregate prefetch URLs into an array while iterating.
      // after the loop is complete, check the count.
      // if it exceeds the size of the cache, remove overflow elements from the beginning.
      if (should_prefetch_url(matching_url))
        prefetch_urls.push(matching_url)

      let ts_file_ext    = get_ts_file_ext(file_name, file_ext)
      let redirected_url = `${ is_secure ? 'https' : 'http' }://${host}:${port}/${ base64_encode(matching_url) }${ts_file_ext || file_ext || ''}`
      debug(3, 'redirecting (proxied):', redirected_url)

      return `${head}${redirected_url}${tail}`
    })

    if (prefetch_urls.length) {
      if (prefetch_urls.length > max_segments) {
        let overflow = prefetch_urls.length - max_segments

        prefetch_urls.splice(0, overflow)
        debug(3, 'prefetch (ignored):', `${overflow} URLs in m3u8 skipped to prevent cache overflow`)
      }
      prefetch_urls.forEach((matching_url, index) => {
        prefetch_segment(m3u8_url, matching_url)

        prefetch_urls[index] = undefined
      })
    }

    if (debug_level >= 3) {
      m3u8_content = m3u8_content.replace(regexs.keys, function(match, head, key_url, tail) {
        debug(3, 'key (proxied):', key_url)
        return match
      })
    }

    return m3u8_content
  }

  // Access Control
  if (acl_whitelist) {
    acl_whitelist = acl_whitelist.trim().toLowerCase().split(/\s*,\s*/g)

    server.on('connection', (socket) => {
      if (socket && socket.remoteAddress) {
        let remoteIP = socket.remoteAddress.toLowerCase().replace(/^::?ffff:/, '')

        if (acl_whitelist.indexOf(remoteIP) === -1) {
          socket.destroy()
          debug(2, socket.remoteFamily, 'connection blocked by ACL whitelist:', remoteIP)
        }
      }
    })
  }

  // Create an HTTP tunneling proxy
  server.on('request', (req, res) => {
    debug(3, 'proxying (raw):', req.url)

    add_CORS_headers(res)

    const url     = base64_decode( req.url.replace(regexs.wrap, '$1') ).trim()
    const is_m3u8 = regexs.m3u8.test(url)

    const send_ts = function(segment) {
      res.writeHead(200, { "Content-Type": "video/MP2T" })
      res.end(segment)
    }

    if (cache_segments && !is_m3u8) {
      let segment = get_segment(url)   // Buffer (cached segment data), false (prefetch is pending: add callback), undefined (no prefetch is pending)

      if (segment && segment.length) { // Buffer (cached segment data)
        send_ts(segment)
        return
      }
      else if (segment === false) {    // false (prefetch is pending: add callback)
        add_listener(url, send_ts)
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
      debug(0, 'ERROR:', e.message)
      res.writeHead(500)
      res.end()
    })
  })
}

module.exports = proxy
