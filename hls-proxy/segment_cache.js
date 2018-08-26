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

  const get_segment = function(url) {
    if (! should_prefetch_url(url)) return undefined

    let segment
    let index = find_index_of_segment(url)
    if (index !== undefined) {
      debug(2, 'cache (hit):', url)

      segment = ts[index].databuffer

      // cleanup: remove all previous segments
      ts.splice(0, (index + 1))
    }
    else {
      debug(2, 'cache (miss):', url)
    }
    return segment
  }

  const prefetch_segment = function(url) {
    if (! should_prefetch_url(url)) return

    let index = find_index_of_segment(url)
    if (index === undefined) {
      debug(2, 'prefetch (start):', url)

      // placeholder to prevent multiple download requests
      index = ts.length
      ts[index] = {url, databuffer: undefined}

      let options = get_request_options(url)
      request(options, '', {binary: true, stream: false})
      .then(({response}) => {
        debug(2, `prefetch (complete, ${response.length} bytes):`, url)

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

  return {
    prefetch_segment,
    get_segment
  }
}
