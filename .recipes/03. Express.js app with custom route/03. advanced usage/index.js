const express = require('express')
const router1 = express.Router()
const router2 = express.Router()
const router3 = express.Router()
const router4 = express.Router()
const app = express()

const port = 8080

const logger_only = false

const logger = (req, res, next) => {
  const {originalUrl, url, baseUrl, path, params} = req
  const log_msg = 'express request: ' + JSON.stringify({originalUrl, url, baseUrl, path, params}, null, 2)

  console.log(log_msg)

  if (logger_only) {
    res.writeHead(200, { "Content-Type": "text/plain" })
    res.end(log_msg)
  }
  else {
    next()
  }
}

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
  debug_level:    (logger_only ? -1 : 3),
  acl_whitelist:  null
})

app.use(router1)

router1.use('/foo', router2)
router2.use('/bar', router3)
router3.use('/baz', router4)

// log express.js request attributes before hls-proxy serves a response
router4.get('/proxy/*', [logger, middleware.request])

app.listen(port, function () {
  console.log(`Express.js HTTP server is listening on port: ${port}`)
})
