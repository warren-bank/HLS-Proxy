const fs = require('fs')
const path = require('path')

const output_manifest_file = process.env.output_manifest_file
  ? path.normalize(process.env.output_manifest_file)
  : null

const video_url       = process.env.video_url
const interval_ms     = process.env.interval_ms     ? parseInt(process.env.interval_ms,     10) : null
const max_duration_ms = process.env.max_duration_ms ? parseInt(process.env.max_duration_ms, 10) : null

module.exports = {
  request_intervals: (add_request_interval) => {
    if (!output_manifest_file || !video_url || (interval_ms === null) || (max_duration_ms === null) || isNaN(interval_ms) || isNaN(max_duration_ms)) {
      console.log('Environment variables are not properly configured for the hook function to create a request interval.')
      return
    }

    const proxy_url      = process.env.proxy_url
    const file_extension = '.m3u8'
    const hls_proxy_url  = `${proxy_url}/${ btoa(video_url) }${file_extension}`

    fs.rmSync(output_manifest_file, {force: true})

    let last_video_segment = null

    add_request_interval(
      interval_ms, // run timer at interval to download and cache new HSL video segments
      async (request) => {
        const {response} = await request(hls_proxy_url)
        let manifest_data = response.toString().trim()
        const lines = manifest_data.split(/[\r\n]+/)

        if (last_video_segment) {
          const index = lines.indexOf(last_video_segment)

          if (index >= 0)
            manifest_data = lines.slice(index + 1).join("\n")
          else
            console.log('Warning: The request interval is too large! Video segments could fail to be cached.')
        }

        for (let i = lines.length - 1; i >= 0; i--) {
          if (lines[i].startsWith(proxy_url)) {
            last_video_segment = lines[i]
            break
          }
        }

        if (manifest_data)
          fs.appendFileSync(output_manifest_file, manifest_data + "\n", {encoding: 'utf8', flush: true})
      },
      max_duration_ms
    )

  }
}
