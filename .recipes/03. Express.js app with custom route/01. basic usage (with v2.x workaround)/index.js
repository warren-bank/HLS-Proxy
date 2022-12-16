const express = require('express')
const app = express()

const port = 8080

const middleware = require('../../../hls-proxy/proxy')({
  is_secure:      false,
  host:           null,
  req_headers:    null,
  req_options:    null,
  hooks:          null,
  cache_segments: true,
  max_segments:   20,
  cache_timeout:  60,
  cache_key:      0,
  debug_level:    3,
  acl_whitelist:  null
})

// =================
// hacky workaround:
// =================
//   Append a character to the end of the custom route that isn't included in the set of characters encoded by base64 (ex: '_').
//   This will prevent the route from mistakenly being included in the base64 encoded URL.
//   Unfortunately, the version of base64 encoding used by Javascript includes the '/' character.
// =================
//   See: https://en.wikipedia.org/wiki/Base64#Variants_summary_table
// =================
app.get('/proxy_/*', middleware.request)

app.listen(port, function () {
  console.log(`Express.js HTTP server is listening on port: ${port}`)
})
