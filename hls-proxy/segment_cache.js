module.exports = function({should_prefetch_url, debug, debug_level, request, get_request_options, max_segments, cache_timeout, cache_key}) {

  // maps: "m3u8_url" => {access: timestamp, ts: []}
  const cache = {}

  const get_cache = function(m3u8_url) {
    const data = cache[m3u8_url]
    if (! data instanceof Object) return null
    return data
  }

  const get_ts = function(m3u8_url) {
    const data = get_cache(m3u8_url)
    if (!data) return null

    const ts = data.ts
    if (!Array.isArray(ts)) return null
    return ts
  }

  const has_cache = function(m3u8_url) {
    const ts = get_ts(m3u8_url)
    return (ts && ts.length)
  }

  const clear_ts = function(m3u8_url) {
    const data = get_cache(m3u8_url)
    if (!data) return

    data.ts = []
  }

  const get_timestamp = function() {
    const ms  = (new Date()).getTime()
    const sec = Math.floor(ms / 1000)
    return sec
  }

  const get_time_since_last_access = function(m3u8_url) {
    const data = get_cache(m3u8_url)
    if (!data) return -1

    const now = get_timestamp()
    return (now - data.access)
  }

  const is_expired = function(m3u8_url) {
    const time_since_last_access = get_time_since_last_access(m3u8_url)

    if (time_since_last_access < 0) return false

    // special case
    if (cache_timeout === 0) return false

    // short-circuit for known result
    if (cache_timeout < 0) return true

    return (time_since_last_access >= cache_timeout)
  }

  const touch_access = function(m3u8_url) {
    const data = get_cache(m3u8_url)
    if (!data) return

    data.access = get_timestamp()
  }

  const ts_garbage_collect = function(m3u8_url, start, count) {
    const ts = get_ts(m3u8_url)
    if (!ts) return

    for (let i=start; i < (start + count); i++) {
      if (i >= ts.length) break

      ts[i].databuffer = undefined
    }
    ts.splice(start, count)
  }

  const regexs = {
    "ts_extension": /\.ts(?:[\?#]|$)/i,
    "ts_filename":  /^.*?\/([^\/]+\.ts).*$/i,
    "ts_sequence":  /^.*?(\d+\.ts).*$/i
  }

  const is_ts_file = function(url) {
    return regexs["ts_extension"].test(url)
  }

  const get_privatekey_from_url = (url) => url

  const get_publickey_from_url = function(url) {
    // short-circuit for special case: hook function allows prefetching urls with non-standard file extensions
    if (!is_ts_file(url))
      return url

    switch (cache_key) {
      case 2:
        // full URL of .ts file
        return url
        break
      case 1:
        // full filename of .ts file
        return url.replace(regexs["ts_filename"], '$1')
        break
      case 0:
      default:
        // sequence number of .ts file w/ .ts file extension (ex: "123.ts")
        return url.replace(regexs["ts_sequence"], '$1')
        break
    }
  }

  const find_index_of_segment = function(m3u8_url, url) {
    let index

    const ts = get_ts(m3u8_url)
    if (!ts) return index

    const key = get_privatekey_from_url(url)
    let i, segment

    for (i=(ts.length - 1); i>=0; i--) {
      segment = ts[i]  // {key, databuffer}
      if (segment && (segment.key === key)) {
        index = i
        break
      }
    }
    return index
  }

  const find_segment = function(url) {
    let m3u8_url, index

    for (m3u8_url in cache) {
      index = find_index_of_segment(m3u8_url, url)

      if (index !== undefined)
        return {m3u8_url, index}
    }
  }

  const prefetch_segment = function(m3u8_url, url, referer_url, dont_touch_access) {
    if (! should_prefetch_url(url)) return

    if (cache[m3u8_url] === undefined) {
      // initialize a new data structure
      cache[m3u8_url] = {access: 0, ts: []}
    }

    if (!dont_touch_access)
      touch_access(m3u8_url)

    const ts = get_ts(m3u8_url)

    let debug_url = (debug_level >= 3) ? url : get_publickey_from_url(url)

    let index = find_index_of_segment(m3u8_url, url)
    if (index === undefined) {
      debug(1, 'prefetch (start):', debug_url)

      // placeholder to prevent multiple download requests
      index = ts.length
      ts[index] = {key: get_privatekey_from_url(url), databuffer: false}

      let options = get_request_options(url, referer_url)
      request(options, '', {binary: true, stream: false})
      .then(({response}) => {
        debug(1, `prefetch (complete, ${response.length} bytes):`, debug_url)

        // asynchronous callback could occur after garbage collection; the index could've changed
        index = find_index_of_segment(m3u8_url, url)
        if (index === undefined) throw new Error('Prefetch completed after pending request was ejected from cache. Try increasing the "--max-segments" option.')

        if (!dont_touch_access)
          touch_access(m3u8_url)

        let segment = ts[index].databuffer
        if (segment && (segment instanceof Array)) {
          segment.forEach((cb) => {
            cb(response)

            debug(1, 'cache (callback complete):', debug_url)
          })
        }
        ts[index].databuffer = response

        // cleanup: prune length of ts[] so it contains no more than "max_segments"
        if (ts.length > max_segments) {
          let overflow = ts.length - max_segments
          ts_garbage_collect(m3u8_url, 0, overflow)
        }
      })
      .catch((e) => {
        debug(1, 'prefetch (error):', debug_url)
        debug(2, 'prefetch (error):', e.message)

        // asynchronous callback could occur after garbage collection; the index could've changed
        index = find_index_of_segment(m3u8_url, url)
        if (index !== undefined) ts_garbage_collect(m3u8_url, index, 1)
      })
    }
  }

  const get_segment = function(url) {
    if (! should_prefetch_url(url)) return undefined

    let debug_url = (debug_level >= 3) ? url : get_publickey_from_url(url)

    let segment = find_segment(url)
    if (segment !== undefined) {
      const {m3u8_url, index} = segment
      const ts = get_ts(m3u8_url)
      touch_access(m3u8_url)

      segment = ts[index].databuffer

      if ((segment === false) || (segment instanceof Array)) {
        debug(1, 'cache (pending prefetch):', debug_url)

        return false
      }
      debug(1, 'cache (hit):', debug_url)

      // cleanup: remove all previous segments
      // =====================================
      // todo:
      //   - why does this sometimes cause the video player to get stuck.. repeatedly request the .m3u8 file, but stop requesting any .ts segments?
      //   - is it a coincidence that commenting this line appears to stop such behavior?
      //   - could it possibly be a race condition? cleanup also occurs asynchronously when prefetch responses are received, but javascript (node) is single threaded.. and this code doesn't yield or use a timer.
      // =====================================
      // ts_garbage_collect(m3u8_url, 0, (index + 1))
    }
    else {
      debug(1, 'cache (miss):', debug_url)
    }
    return segment
  }

  const add_listener = function(url, cb) {
    if (! should_prefetch_url(url)) return false

    let debug_url = (debug_level >= 3) ? url : get_publickey_from_url(url)

    let segment = find_segment(url)
    if (segment !== undefined) {
      const {m3u8_url, index} = segment
      const ts = get_ts(m3u8_url)
      touch_access(m3u8_url)

      segment = ts[index].databuffer

      if (segment === false) {
        ts[index].databuffer = [cb]

        debug(1, 'cache (callback added):', debug_url)
      }
      else if (segment instanceof Array) {
        ts[index].databuffer.push(cb)

        debug(1, 'cache (callback added):', debug_url)
      }
      else {
        cb(segment)

        debug(1, 'cache (callback complete):', debug_url)
      }
    }
    return true
  }

  // set timer to enforce the timeout policy
  if (cache_timeout !== 0) {
    // cannot run more often than once per minute.
    // negative timeouts are OK.
    const interval = Math.max(
      (1000 * cache_timeout),
      (1000 * 60)
    )

    setInterval(() => {
      for (let m3u8_url in cache) {
        if (is_expired(m3u8_url))
          clear_ts(m3u8_url)
      }
    }, interval)
  }

  // at a very high log verbosity level, set timer to dump a summary of the cache state every few seconds
  if (debug_level >= 3) {
    setInterval(() => {
      const cache_summary = {}
      for (let m3u8_url in cache) {
        const ts = get_ts(m3u8_url)
        cache_summary[m3u8_url] = ts.map(segment => get_publickey_from_url(segment.key))
      }
      debug(3, 'cache (keys):', JSON.stringify(cache_summary))
    }, 5000)
  }

  return {
    has_cache,
    get_time_since_last_access,
    is_expired,
    prefetch_segment,
    get_segment,
    add_listener
  }
}
