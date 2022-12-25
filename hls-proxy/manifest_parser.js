const {URL} = require('@warren-bank/url')
const utils = require('./utils')

const regexs = {
  vod_start_at:        /#vod_start(?:_prefetch_at)?=((?:\d+:)?(?:\d+:)?\d+)$/i,
  m3u8_line_separator: /\s*[\r\n]+\s*/,
  m3u8_line_landmark:  /^(#[^:]+[:]?)/,
  m3u8_line_url:       /URI=["']([^"']+)["']/id
}

const url_location_landmarks = {
  m3u8: {
    same_line: [
      '#EXT-X-MEDIA:',
      '#EXT-X-I-FRAME-STREAM-INF:',
      '#EXT-X-RENDITION-REPORT:',
      '#EXT-X-DATERANGE:',
      '#EXT-X-CONTENT-STEERING:'
    ]
  },
  ts: {
    same_line: [
      '#EXT-X-MAP:',
      '#EXT-X-PART:',
      '#EXT-X-PRELOAD-HINT:'
    ]
  },
  json: {
    same_line: [
      '#EXT-X-SESSION-DATA:'
    ]
  },
  key: {
    same_line: [
      '#EXT-X-KEY:'
    ]
  },
  other: {
    same_line: []
  }
}

const meta_data_location_landmarks = {
  is_vod: {
    same_line: [
      '#EXT-X-PLAYLIST-TYPE:',
      '#EXT-X-ENDLIST'
    ],
    resolve_value: {
      '#EXT-X-PLAYLIST-TYPE:': (m3u8_line, landmark) => {
        const value = m3u8_line.substring(landmark.length, landmark.length + 3)
        return (value.toUpperCase() === 'VOD')
      },
      '#EXT-X-ENDLIST': () => true
    }
  },
  seg_duration_ms: {
    same_line: [
      '#EXT-X-TARGETDURATION:'
    ],
    resolve_value: {
      '#EXT-X-TARGETDURATION:': (m3u8_line, landmark) => {
        m3u8_line = m3u8_line.substring(landmark.length)
        const value = parseInt(m3u8_line, 10)
        return isNaN(value)
          ? null
          : (value * 1000)  // convert seconds to ms
      }
    }
  }
}

const get_vod_start_at_ms = function(m3u8_url) {
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
}

const parse_HHMMSS_to_seconds = function(str) {
  const parts    = str.split(':')
  let seconds    = 0
  let multiplier = 1

  while (parts.length > 0) {
    seconds    += multiplier * parseInt(parts.pop(), 10)
    multiplier *= 60
  }

  return seconds
}

// returns: {
//   meta_data:     {is_vod, seg_duration_ms},
//   embedded_urls: [{line_index, url_indices, url_type, original_match_url, resolved_match_url, redirected_url, unencoded_url, encoded_url, referer_url}],
//   prefetch_urls: [],
//   modified_m3u8: ''
// }
const parse_manifest = function(m3u8_content, m3u8_url, referer_url, hooks, cache_segments, debug, vod_start_at_ms, redirected_base_url, should_prefetch_url) {
  const m3u8_lines = m3u8_content.split(regexs.m3u8_line_separator)
  m3u8_content = null

  const meta_data     = {}
  const embedded_urls = extract_embedded_urls(m3u8_lines, m3u8_url, referer_url, (cache_segments ? meta_data : null))
  const prefetch_urls = []

  if (embedded_urls && Array.isArray(embedded_urls) && embedded_urls.length) {
    embedded_urls.forEach(embedded_url => {
      redirect_embedded_url(embedded_url, hooks, m3u8_url, debug)
      finalize_embedded_url(embedded_url, vod_start_at_ms, debug)
      encode_embedded_url(embedded_url, redirected_base_url, debug)
      get_prefetch_url(embedded_url, should_prefetch_url, prefetch_urls)
      modify_m3u8_line(embedded_url, m3u8_lines)
    })
  }

  return {
    meta_data,
    embedded_urls,
    prefetch_urls,
    modified_m3u8: m3u8_lines.filter(line => !!line).join("\n")
  }
}

const extract_embedded_urls = function(m3u8_lines, m3u8_url, referer_url, meta_data) {
  const embedded_urls = []

  // one of: ['master','media']
  // determined by the detection of either: ['#EXT-X-STREAM-INF','#EXTINF'], respectively
  // until the type is determined, URI lines are ignored (as per the HLS spec)
  let manifest_type = null

  let m3u8_line, matches, matching_landmark, matching_url

  for (let i=0; i < m3u8_lines.length; i++) {
    m3u8_line = m3u8_lines[i]

    if (is_m3u8_line_a_blank(m3u8_line) || is_m3u8_line_a_comment(m3u8_line))
      continue

    if (is_m3u8_line_a_tag(m3u8_line)) {
      matches = regexs.m3u8_line_landmark.exec(m3u8_line)
      if (!matches) continue
      matching_landmark = matches[1]

      if (manifest_type === null) {
        if (matching_landmark === '#EXT-X-STREAM-INF:')
          manifest_type = 'master'
        else if (matching_landmark === '#EXTINF:')
          manifest_type = 'media'
      }

      if (meta_data !== null)
        extract_meta_data(meta_data, m3u8_line, matching_landmark)

      matches = regexs.m3u8_line_url.exec(m3u8_line)
      if (!matches) continue
      matching_url = matches[1]

      for (let url_type in url_location_landmarks) {
        if (url_location_landmarks[url_type]['same_line'].indexOf(matching_landmark) >= 0) {
          embedded_urls.push({
            line_index:         i,
            url_indices:        matches.indices[1],
            url_type:           url_type,
            original_match_url: matching_url,
            resolved_match_url: (new URL(matching_url, m3u8_url)).href,
            redirected_url:     null,
            referer_url:        referer_url,
            encoded_url:        null
          })
          break
        }
      }
    }
    else {
      // line is a URI
      if (manifest_type === null) continue

      const url_type = (manifest_type === 'master') ? 'm3u8' : 'ts'

      embedded_urls.push({
        line_index:         i,
        url_indices:        null,
        url_type:           url_type,
        original_match_url: m3u8_line,
        resolved_match_url: (new URL(m3u8_line, m3u8_url)).href,
        redirected_url:     null,
        referer_url:        referer_url,
        encoded_url:        null
      })
    }
  }

  return embedded_urls
}

const is_m3u8_line_a_blank = (line) => (!line || !line.trim())

const is_m3u8_line_a_comment = (line) => ((line.indexOf('#') === 0) && !is_m3u8_line_a_tag(line))

const is_m3u8_line_a_tag = (line) => (line.indexOf('#EXT') === 0)

const extract_meta_data = function(meta_data, m3u8_line, matching_landmark) {
  for (let meta_data_key in meta_data_location_landmarks) {
    if (meta_data_location_landmarks[meta_data_key]['same_line'].indexOf(matching_landmark) >= 0) {
      const func = meta_data_location_landmarks[meta_data_key]['resolve_value'][matching_landmark]
      if (typeof func === 'function') {
        const meta_data_value = func(m3u8_line, matching_landmark)
        if ((meta_data_value !== undefined) && (meta_data_value !== null)) {
          meta_data[meta_data_key] = meta_data_value
        }
      }
    }
  }
}

const redirect_embedded_url = function(embedded_url, hooks, m3u8_url, debug) {
  if (hooks && (hooks instanceof Object) && hooks.redirect && (typeof hooks.redirect === 'function')) {
    let url, url_type, referer_url, result

    url         = embedded_url.resolved_match_url
    url_type    = null
    referer_url = null

    debug(3, 'redirecting (pre-hook):', url)

    try {
      result = hooks.redirect(url, embedded_url.referer_url)

      if (result) {
        if (typeof result === 'string') {
          url         = result
        }
        else if (result instanceof Object) {
          url         = result.url
          url_type    = result.url_type
          referer_url = result.referer_url
        }
      }

      if (typeof url !== 'string') throw new Error('bad return value')

      url = url.trim()

      if (url.length && (url.toLowerCase().indexOf('http') !== 0))
        url = (new URL(url, m3u8_url)).href
    }
    catch(e) {
      url = ''
    }

    if (url) {
      embedded_url.redirected_url = url

      if (typeof url_type === 'string') {
        url_type = url_type.toLowerCase().trim()

        if (url_type.length)
          embedded_url.url_type = url_type
      }

      if (typeof referer_url === 'string') {
        referer_url = referer_url.trim()

        if (referer_url.length && (referer_url.toLowerCase().indexOf('http') === 0))
          embedded_url.referer_url = referer_url
      }

      debug(3, 'redirecting (post-hook):', url)
    }
    else {
      embedded_url.redirected_url = ''

      debug(3, 'redirecting (post-hook):', 'URL filtered, removed from manifest')
    }
  }
}

const finalize_embedded_url = function(embedded_url, vod_start_at_ms, debug) {
  if (embedded_url.redirected_url === '') {
    embedded_url.unencoded_url = ''
  }
  else {
    let url = embedded_url.redirected_url || embedded_url.resolved_match_url

    if (embedded_url.url_type)
      debug(3, 'url type:', embedded_url.url_type)

    debug(2, 'redirecting:', url)

    if (vod_start_at_ms && (embedded_url.url_type === 'm3u8'))
      url += `#vod_start=${Math.floor(vod_start_at_ms/1000)}`

    if (embedded_url.referer_url)
      url += `|${embedded_url.referer_url}`

    embedded_url.unencoded_url = url
  }
}

const encode_embedded_url = function(embedded_url, redirected_base_url, debug) {
  embedded_url.encoded_url = (embedded_url.unencoded_url)
    ? `${redirected_base_url}/${ utils.base64_encode(embedded_url.unencoded_url) }.${embedded_url.url_type || 'other'}`
    : ''

  if (embedded_url.encoded_url)
    debug(3, 'redirecting (proxied):', embedded_url.encoded_url)
}

const get_prefetch_url = function(embedded_url, should_prefetch_url, prefetch_urls = []) {
  if (embedded_url.redirected_url !== '') {
    const url = embedded_url.redirected_url || embedded_url.resolved_match_url

    if (should_prefetch_url(url, embedded_url.url_type))
      prefetch_urls.push(url)
  }
}

const modify_m3u8_line = function(embedded_url, m3u8_lines) {
  const {line_index, url_indices, encoded_url} = embedded_url

  if (url_indices && Array.isArray(url_indices) && (url_indices.length === 2)) {
    const m3u8_line = m3u8_lines[line_index]

    m3u8_lines[line_index] = m3u8_line.substring(0, url_indices[0]) + encoded_url + m3u8_line.substring(url_indices[1])
  }
  else {
    m3u8_lines[line_index] = encoded_url
  }
}

const modify_m3u8_content = function(params, segment_cache, m3u8_content, m3u8_url, referer_url, redirected_base_url) {
  const {hooks, cache_segments, max_segments, debug_level} = params

  const {has_cache, get_time_since_last_access, is_expired, prefetch_segment} = segment_cache

  const debug               = utils.debug.bind(null, params)
  const should_prefetch_url = utils.should_prefetch_url.bind(null, params)

  if (hooks && (hooks instanceof Object) && hooks.modify_m3u8_content && (typeof hooks.modify_m3u8_content === 'function')) {
    m3u8_content = hooks.modify_m3u8_content(m3u8_content, m3u8_url) || m3u8_content
  }

  const debug_divider = (debug_level >= 4)
    ? ('-').repeat(40)
    : ''

  if (debug_level >= 4) {
    debug(4, 'proxied response (original m3u8):', `\n${debug_divider}\n${m3u8_content}\n${debug_divider}`)
  }

  let is_vod, seg_duration_ms, prefetch_urls

  // only used with prefetch
  const vod_start_at_ms = (cache_segments)
    ? get_vod_start_at_ms(m3u8_url)
    : null

  // only used with prefetch
  const perform_prefetch = (cache_segments)
    ? (urls, dont_touch_access) => {
        if (!urls || !Array.isArray(urls) || !urls.length)
          return

        let promise

        if (is_vod || has_cache(m3u8_url)) {
          promise = Promise.resolve()
        }
        else {
          const matching_url = urls[0]
          urls[0] = undefined

          promise = prefetch_segment(m3u8_url, matching_url, referer_url, dont_touch_access)
        }

        promise.then(() => {
          urls.forEach((matching_url, index) => {
            if (matching_url) {
              prefetch_segment(m3u8_url, matching_url, referer_url, dont_touch_access)

              urls[index] = undefined
            }
          })
        })
      }
    : null

  {
    const parsed_manifest = parse_manifest(m3u8_content, m3u8_url, referer_url, hooks, cache_segments, debug, vod_start_at_ms, redirected_base_url, should_prefetch_url)
    is_vod          = !!parsed_manifest.meta_data.is_vod                  // default: false => hls live stream
    seg_duration_ms = parsed_manifest.meta_data.seg_duration_ms || 10000  // default: 10 seconds in ms
    prefetch_urls   = parsed_manifest.prefetch_urls
    m3u8_content    = parsed_manifest.modified_m3u8

    if (debug_level >= 4) {
      debug(4, 'parsed manifest:', `\n${debug_divider}\n${JSON.stringify(parsed_manifest, null, 2)}\n${debug_divider}`)
    }
  }

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

  if (debug_level >= 4) {
    debug(4, 'proxied response (modified m3u8):', `\n${debug_divider}\n${m3u8_content}\n${debug_divider}`)
  }

  return m3u8_content
}

module.exports = {
  modify_m3u8_content
}
