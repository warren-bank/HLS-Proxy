module.exports = function({debug, debug_level, request, get_request_options, max_segments}) {
  max_segments = max_segments || 20

  const ts = []

  const ts_garbage_collect = function(start, count) {
    for (let i=start; i < (start + count); i++) {
      if (i >= ts.length) break

      ts[i].databuffer = undefined
    }
    ts.splice(start, count)
  }

  const regexs = {
    "ts_extension": /\.ts(?:[\?#]|$)/i,
    "ts_sequence":  /^.*?(\d+\.ts).*$/i
  }

  const should_prefetch_url = function(url) {
    return regexs["ts_extension"].test(url)
  }

  const get_key_from_url = function(url) {
    return url.replace(regexs["ts_sequence"], '$1')
  }

  const find_index_of_segment = function(url) {
    let key = get_key_from_url(url)
    let index
    for (let i=(ts.length - 1); i>=0; i--) {
      let segment = ts[i]  // {key, databuffer}
      if (segment && (segment.key === key)) {
        index = i
        break
      }
    }
    return index
  }

  const prefetch_segment = function(url) {
    if (! should_prefetch_url(url)) return

    let index = find_index_of_segment(url)
    if (index === undefined) {
      debug(2, 'prefetch (start):', url)

      // placeholder to prevent multiple download requests
      index = ts.length
      ts[index] = {key: get_key_from_url(url), databuffer: false}

      let options = get_request_options(url)
      request(options, '', {binary: true, stream: false})
      .then(({response}) => {
        debug(2, `prefetch (complete, ${response.length} bytes):`, url)

        // asynchronous callback could occur after garbage collection; the index could've changed
        index = find_index_of_segment(url)
        if (index === undefined) throw new Error('Prefetch completed after pending request was ejected from cache. Try increasing the "--max-segments" option.')

        let segment = ts[index].databuffer
        if (segment && (segment instanceof Array)) {
          segment.forEach((cb) => {
            cb(response)

            debug(2, 'cache (callback complete):', url)
          })
        }
        ts[index].databuffer = response

        // cleanup: prune length of ts[] so it contains no more than "max_segments"
        if (ts.length > max_segments) {
          let overflow = ts.length - max_segments
          ts_garbage_collect(0, overflow)
        }
      })
      .catch((e) => {
        debug(3, 'prefetch (error):', e.message)

        // asynchronous callback could occur after garbage collection; the index could've changed
        index = find_index_of_segment(url)
        if (index !== undefined) ts_garbage_collect(index, 1)
      })
    }
  }

  const get_segment = function(url) {
    if (! should_prefetch_url(url)) return undefined

    let segment
    let index = find_index_of_segment(url)
    if (index !== undefined) {
      segment = ts[index].databuffer

      if ((segment === false) || (segment instanceof Array)) {
        debug(2, 'cache (pending prefetch):', url)

        return false
      }
      debug(2, 'cache (hit):', url)

      // cleanup: remove all previous segments
      // =====================================
      // todo:
      //   - why does this sometimes cause the video player to get stuck.. repeatedly request the .m3u8 file, but stop requesting any .ts segments?
      //   - is it a coincidence that commenting this line appears to stop such behavior?
      //   - could it possibly be a race condition? cleanup also occurs asynchronously when prefetch responses are received, but javascript (node) is single threaded.. and this code doesn't yield or use a timer.
      // =====================================
      // ts_garbage_collect(0, (index + 1))
    }
    else {
      debug(2, 'cache (miss):', url)
    }
    return segment
  }

  const add_listener = function(url, cb) {
    if (! should_prefetch_url(url)) return false

    let segment
    let index = find_index_of_segment(url)
    if (index !== undefined) {
      segment = ts[index].databuffer

      if (segment === false) {
        ts[index].databuffer = [cb]

        debug(3, 'cache (callback added):', url)
      }
      else if (segment instanceof Array) {
        ts[index].databuffer.push(cb)

        debug(3, 'cache (callback added):', url)
      }
      else {
        cb(segment)

        debug(3, 'cache (callback complete):', url)
      }
    }
    return true
  }

  if (debug_level >= 3) {
    setInterval(() => {
      let ts_cache_keys = []
      ts.forEach((cache) => ts_cache_keys.push(cache.key))
      debug(3, 'cache (keys):', JSON.stringify(ts_cache_keys))
    }, 5000)
  }

  return {
    prefetch_segment,
    get_segment,
    add_listener
  }
}
