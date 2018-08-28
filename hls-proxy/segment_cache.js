module.exports = function({debug, request, get_request_options, max_segments}) {
  max_segments = max_segments || 20

  const ts = []

  const find_index_of_segment = function(url) {
    let index
    for (let i=0; i < ts.length; i++) {
      let segment = ts[i]  // {url, databuffer}
      if (segment.url === url) {
        index = i
        break
      }
    }
    return index
  }

  const segment_pattern = /\.ts(?:[\?#]|$)/i

  const should_prefetch_url = function(url) {
    return segment_pattern.test(url)
  }

  const prefetch_segment = function(url) {
    if (! should_prefetch_url(url)) return

    let index = find_index_of_segment(url)
    if (index === undefined) {
      debug(2, 'prefetch (start):', url)

      // placeholder to prevent multiple download requests
      index = ts.length
      ts[index] = {url, databuffer: false}

      let options = get_request_options(url)
      request(options, '', {binary: true, stream: false})
      .then(({response}) => {
        debug(2, `prefetch (complete, ${response.length} bytes):`, url)

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
          ts.splice(0, overflow)
        }
      })
      .catch((e) => {
        debug(3, 'prefetch (error):', e.message)
        delete ts[index]
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
      // ts.splice(0, (index + 1))
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

  return {
    prefetch_segment,
    get_segment,
    add_listener
  }
}
