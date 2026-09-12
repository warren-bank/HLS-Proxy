const fs = require('fs')
const path = require('path')

const proxy_manifest_file = process.env.proxy_manifest_file
  ? path.normalize(process.env.proxy_manifest_file)
  : null

const fpath_manifest_file = process.env.fpath_manifest_file
  ? path.normalize(process.env.fpath_manifest_file)
  : null

const video_url         = process.env.video_url
const interval_ms       = process.env.interval_ms       ? parseInt(process.env.interval_ms,       10) : null
const max_duration_ms   = process.env.max_duration_ms   ? parseInt(process.env.max_duration_ms,   10) : null
const max_cache_retries = process.env.max_cache_retries ? parseInt(process.env.max_cache_retries, 10) : 5
const proxy_url         = process.env.proxy_url
const file_extension    = '.m3u8'
const hls_proxy_url     = `${proxy_url}/${ btoa(video_url) }${file_extension}`

let last_video_segment  = null
let fpath_manifest_data = []

const request_interval_callback = async (request, context) => {
  let proxy_manifest_data
  try {
    const {response} = await request(hls_proxy_url)
    proxy_manifest_data = response.toString().trim()
  }
  catch(error) {
    console.log('Interval callback failed to download HLS manifest.', error.statusCode || '', error.message)
  }
  if (!proxy_manifest_data) {
    // retry immediately
    request_interval_callback(request, context)
    return
  }

  let lines = proxy_manifest_data.split(/[\r\n]+/)

  if (last_video_segment) {
    const index = lines.indexOf(last_video_segment)

    if (index >= 0) {
      lines = lines.slice(index + 1)
    }
    else {
      console.log('Warning: The request interval is too large! Video segments could fail to be cached.')

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF')) break
        else lines[i] = null
      }
      lines = lines.filter(line => !!line)
    }
  }

  if (lines.length) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].startsWith(proxy_url)) {
        last_video_segment = lines[i]
        break
      }
    }

    proxy_manifest_data = lines.join("\n")

    fs.appendFileSync(
      proxy_manifest_file,
      proxy_manifest_data + "\n",
      {encoding: 'utf8', flush: true}
    )

    fpath_manifest_data.push({
      retries: 0,
      done: false,
      data: proxy_manifest_data
    })

    process_fpath_manifest_data(context)
  }
}

const process_fpath_manifest_data = (context) => {
  for (let i = 0; i < fpath_manifest_data.length; i++) {
    replace_proxy_with_fpath(context, i)
  }

  while (fpath_manifest_data.length) {
    if (fpath_manifest_data[0].done || (fpath_manifest_data[0].retries >= max_cache_retries)) {
      const fpath_manifest_data_item = fpath_manifest_data.shift()

      fs.appendFileSync(
        fpath_manifest_file,
        fpath_manifest_data_item.data + "\n",
        {encoding: 'utf8', flush: true}
      )
    }
    else {
      break
    }
  }
}

const replace_proxy_with_fpath = (context, fpath_manifest_data_index) => {
  const fpath_manifest_data_item = fpath_manifest_data[fpath_manifest_data_index]

  if (fpath_manifest_data_item.done) return
  fpath_manifest_data_item.retries += 1

  let lines = fpath_manifest_data_item.data.split(/[\r\n]+/)
  let done  = true

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith(proxy_url)) {
      const fpath = get_fpath(context, lines[i])

      if (fpath) {
        lines[i] = fpath
      }
      else {
        // not found in cache; leave URL in manifest and retry again later.
        done = false
      }
    }
  }

  const data = lines.join("\n")

  fpath_manifest_data_item.done = done
  fpath_manifest_data_item.data = data
}

const get_fpath = (context, url) => {
  const ts_url = context.extract_encoded_url(url)
  if (!ts_url) return null

  const ts_index = context.internal_filesystem_segment_cache.find_index_of_segment(video_url, ts_url)
  if ((typeof ts_index !== 'number') || (ts_index < 0)) return null

  const ts = context.internal_filesystem_segment_cache.get_ts(video_url)
  if (!Array.isArray(ts) || (ts_index >= ts.length)) return null

  const ts_segment = ts[ts_index]
  if (!ts_segment || !ts_segment.has || !ts_segment.state || !ts_segment.state.fpath) return null

  return ts_segment.state.fpath
}

const finalize_manifests = (context) => {
  if (context && context.timer_id)
    clearInterval(context.timer_id)

  setTimeout(
    function() {
      finalize_manifests_sync(context)
    },
    interval_ms
  )
}

const finalize_manifests_sync = (context) => {
  // mark HLS manifests as complete (live -> VOD)

  fs.appendFileSync(
    proxy_manifest_file,
    '#EXT-X-ENDLIST' + "\n",
    {encoding: 'utf8', flush: true}
  )

  process_fpath_manifest_data(context)
  for (const item of fpath_manifest_data) {
    item.done = true
  }
  process_fpath_manifest_data(context)

  fs.appendFileSync(
    fpath_manifest_file,
    '#EXT-X-ENDLIST' + "\n",
    {encoding: 'utf8', flush: true}
  )

  process.exit(0)
}

module.exports = {
  request_intervals: (add_request_interval) => {
    if (!proxy_manifest_file || !fpath_manifest_file || !video_url || (interval_ms === null) || (max_duration_ms === null) || isNaN(interval_ms) || isNaN(max_duration_ms)) {
      console.log('Environment variables are not properly configured for the hook function to create a request interval.')
      return
    }

    fs.rmSync(proxy_manifest_file, {force: true})
    fs.rmSync(fpath_manifest_file, {force: true})

    let interval_context = null

    add_request_interval(
      interval_ms, // run timer at interval to download and cache new HSL video segments
      (request, context) => {
        interval_context = context

        request_interval_callback(request, context)
      },
      max_duration_ms
    )

    process.on('SIGINT', () => {
      console.log('Caught interrupt signal (Ctrl+C). Finalizing manifests...')
      finalize_manifests(interval_context)
    })

    process.on('SIGHUP', () => {
      console.log('Terminal window closed. Finalizing manifests...')
      finalize_manifests_sync(interval_context)
    })

  }
}
