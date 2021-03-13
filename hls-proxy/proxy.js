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

const proxy = function({server, host, is_secure, req_headers, req_options, hooks, cache_segments, max_segments, cache_timeout, cache_key, debug_level, acl_whitelist}) {

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
    wrap:         new RegExp('/?([^\\._]+)(?:[\\._].*)?$', 'i'),
    origin:       new RegExp('^(https?://[^/]+)(?:/.*)?$', 'i'),
    m3u8:         new RegExp('\\.m3u8(?:[\\?#]|$)', 'i'),
    ts:           new RegExp('\\.ts(?:[\\?#]|$)', 'i'),
    ts_duration:  new RegExp('^#EXT-X-TARGETDURATION:(\\d+)(?:\\.\\d+)?$', 'im'),
    vod:          new RegExp('^(?:#EXT-X-PLAYLIST-TYPE:VOD|#EXT-X-ENDLIST)$', 'im'),
    vod_start_at: new RegExp('#vod_start(?:_prefetch_at)?=((?:\\d+:)?(?:\\d+:)?\\d+)$', 'i'),
    urls:         new RegExp('(^|[\\s\'"])((?:https?:/)?/)?((?:[^\\?#,/\\s\'"]*/)+?)?([^\\?#,/\\s\'"]+?)(\\.[^\\?#,/\\.\\s\'"]+(?:[\\?#][^\\s\'"]*)?)?([\\s\'"]|$)', 'img'),
    keys:         new RegExp('(^#EXT-X-KEY:[^"]*")([^"]+)(".*$)', 'img')
  }

  const add_CORS_headers = function(res) {
    res.setHeader('Access-Control-Allow-Origin',      '*')
    res.setHeader('Access-Control-Allow-Methods',     '*')
    res.setHeader('Access-Control-Allow-Headers',     '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Access-Control-Max-Age',           '86400')
  }

  const get_request_options = function(url, referer_url) {
    if (!req_options && !req_headers && !referer_url) return url

    const request_options = Object.assign(
      {},
      parse_url(url),
      (req_options || {})
    )

    if (!req_headers && !referer_url) return request_options

    request_options.headers = Object.assign(
      {},
      (request_options.headers || {}),
      (req_headers || {}),
      (referer_url ? {"referer": referer_url, "origin": referer_url.replace(regexs.origin, '$1')} : {})
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

  let has_cache, get_time_since_last_access, is_expired, prefetch_segment, get_segment, add_listener
  if (cache_segments) {(
    {has_cache, get_time_since_last_access, is_expired, prefetch_segment, get_segment, add_listener} = require('./segment_cache')({should_prefetch_url, debug, debug_level, request, get_request_options, max_segments, cache_timeout, cache_key})
  )}

  const modify_m3u8_content = function(m3u8_content, m3u8_url, referer_url) {
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

    // only used with prefetch
    const seg_duration_ms = (cache_segments)
      ? (() => {
          try {
            const matches  = regexs.ts_duration.exec(m3u8_content)

            if ((matches == null) || !Array.isArray(matches) || (matches.length < 2))
              throw ''

            let duration
            duration = matches[1]
            duration = parseInt(duration, 10)
            duration = duration * 1000  // convert seconds to ms

            return duration
          }
          catch(e) {
            const def_duration = 10000  // 10 seconds in ms

            return def_duration
          }
        })()
      : null

    // only used with prefetch
    const parse_HHMMSS_to_seconds = (cache_segments)
      ? (str) => {
          const parts    = str.split(':')
          let seconds    = 0
          let multiplier = 1

          while (parts.length > 0) {
            seconds    += multiplier * parseInt(parts.pop(), 10)
            multiplier *= 60
          }

          return seconds
        }
      : null

    // only used with prefetch
    const vod_start_at_ms = (cache_segments)
      ? (() => {
          try {
            const matches  = regexs.vod_start_at.exec(m3u8_url)

            if ((matches == null) || !Array.isArray(matches) || (matches.length < 2))
              throw ''

            let offset
            offset = matches[1]
            offset = parse_HHMMSS_to_seconds(offset)
            offset = offset * 1000  // convert seconds to ms

            return offset
          }
          catch(e) {
            const def_offset = null

            return def_offset
          }
        })()
      : null

    // only used with prefetch
    const is_vod = (cache_segments)
      ? ((typeof vod_start_at_ms === 'number') || (!has_cache(m3u8_url) && regexs.vod.test(m3u8_content)))
      : null

    // only used with prefetch
    const perform_prefetch = (cache_segments)
      ? (urls, dont_touch_access) => {
          urls.forEach((matching_url, index) => {
            prefetch_segment(m3u8_url, matching_url, referer_url, dont_touch_access)

            urls[index] = undefined
          })
        }
      : null

    let prefetch_urls = []

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
          let result = hooks.redirect(matching_url, referer_url)

          if (result) {
            if (typeof result === 'string') {
              matching_url = result
            }
            else if (result instanceof Object) {
              if (result.matching_url) matching_url = result.matching_url
              if (result.file_name)    file_name    = result.file_name
              if (result.file_ext)     file_ext     = result.file_ext
              if (result.referer_url)  referer_url  = result.referer_url
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

      if (vod_start_at_ms && regexs.m3u8.test(matching_url))
        matching_url += `#vod_start=${Math.floor(vod_start_at_ms/1000)}`

      if (referer_url)
        matching_url += `|${referer_url}`

      let ts_file_ext    = get_ts_file_ext(file_name, file_ext)
      let redirected_url = `${ is_secure ? 'https' : 'http' }://${host}/${ base64_encode(matching_url) }${ts_file_ext || file_ext || ''}`
      debug(3, 'redirecting (proxied):', redirected_url)

      return `${head}${redirected_url}${tail}`
    })

    if (prefetch_urls.length) {
      if (is_vod && vod_start_at_ms) {
        // full video: prevent prefetch of URLs for skipped video segments

        const skip_segment_count = Math.floor(vod_start_at_ms / seg_duration_ms)

        prefetch_urls.splice(0, skip_segment_count)
        debug(3, 'prefetch (ignored):', `${skip_segment_count} URLs in m3u8 skipped to initialize vod prefetch timer from start position obtained from HLS manifest URL #hash`)
      }
      if (prefetch_urls.length > max_segments) {
        if (hooks && (hooks instanceof Object) && hooks.prefetch_segments && (typeof hooks.prefetch_segments === 'function')) {
          prefetch_urls = hooks.prefetch_segments(prefetch_urls, max_segments, is_vod, seg_duration_ms, perform_prefetch)
        }
        else {
          if (!is_vod) {
            // live stream: cache from the end

            const overflow = prefetch_urls.length - max_segments

            prefetch_urls.splice(0, overflow)
            debug(3, 'prefetch (ignored):', `${overflow} URLs in m3u8 skipped to prevent cache overflow`)
          }
          else {
            // full video: cache from the beginning w/ timer to update cache at rate of playback (assuming no pausing or seeking)

            const $prefetch_urls = [...prefetch_urls]
            const batch_size     = Math.ceil(max_segments / 2)
            const batch_time     = seg_duration_ms * batch_size

            const is_client_paused = () => {
              const time_since_last_access = get_time_since_last_access(m3u8_url)

              let inactivity_timeout
              inactivity_timeout = seg_duration_ms * 2
              inactivity_timeout = Math.floor(inactivity_timeout / 1000)  // convert to seconds

              return (time_since_last_access < 0)
                ? false
                : (time_since_last_access >= inactivity_timeout)
            }

            const prefetch_next_batch = (is_cache_empty) => {
              is_cache_empty = (is_cache_empty === true)

              if (!is_cache_empty && is_expired(m3u8_url)) {
                debug(3, 'prefetch (stopped):', 'vod stream removed from cache due to inactivity longer than timeout; prefetch has stopped')
                return
              }

              if (!is_cache_empty && is_client_paused()) {
                debug(3, 'prefetch (skipped):', 'vod stream is paused; prefetch will continue after client playback resumes')
                setTimeout(prefetch_next_batch, batch_time)
                return
              }

              if ($prefetch_urls.length > batch_size) {
                const batch_urls = $prefetch_urls.splice(0, batch_size)

                perform_prefetch(batch_urls, !is_cache_empty)
                setTimeout(prefetch_next_batch, is_cache_empty ? 0 : batch_time)
              }
              else {
                perform_prefetch($prefetch_urls, !is_cache_empty)
              }
            }

            prefetch_urls = []
            prefetch_next_batch(true)
          }
        }
      }
      perform_prefetch(prefetch_urls)
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

    const [url, referer_url] = (() => {
      let url   = base64_decode( req.url.replace(regexs.wrap, '$1') ).trim()
      let index = url.indexOf('|http')
      if (index >=0) {
        let referer_url = url.substring(index + 1)
        url = url.substring(0, index).trim()
        return [url, referer_url]
      }
      else {
        return [url, '']
      }
    })()

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

    const options = get_request_options(url, referer_url)
    debug(1, 'proxying:', url)
    debug(3, 'm3u8:', (is_m3u8 ? 'true' : 'false'))

    request(options, '', {binary: !is_m3u8, stream: !is_m3u8})
    .then(({response}) => {
      if (!is_m3u8) {
        response.pipe(res)
      }
      else {
        res.writeHead(200, { "Content-Type": "application/x-mpegURL" })
        res.end( modify_m3u8_content(response, url, referer_url) )
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
