const fs = require('fs')
const path = require('path')

const output_manifest_file = process.env.output_manifest_file
  ? path.normalize(process.env.output_manifest_file)
  : path.join(__dirname, 'cached_live_stream.m3u8')

// https://english-livebkali.cgtn.com/live/encgtn.m3u8
// https://english-livebkali.cgtn.com/live/encgtn_3.m3u8
//   RESOLUTION=320x180
//   (4 seconds / video segment)(6 video segments) = 24 seconds

const video_url = 'https://english-livebkali.cgtn.com/live/encgtn_3.m3u8'
const interval_ms = 1000 * 12         // 12  seconds
const max_duration_ms = 1000 * 60 * 4 // 240 seconds = 4 minutes

module.exports = {
  request_intervals: (add_request_interval) => {
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

          manifest_data = lines.slice(index + 1).join("\n")
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
