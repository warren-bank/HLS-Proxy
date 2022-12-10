const request = require('@warren-bank/node-request').request
const cookies = require('./cookies')
const parser  = require('./manifest_parser')
const timers  = require('./timers')
const utils   = require('./utils')

const get_middleware = function(params) {
  const {cache_segments} = params
  let   {acl_whitelist}  = params

  const segment_cache = require('./segment_cache')(params)
  const {get_segment, add_listener} = segment_cache

  const debug               = utils.debug.bind(null, params)
  const parse_req_url       = utils.parse_req_url.bind(null, params)
  const get_request_options = utils.get_request_options.bind(null, params)
  const modify_m3u8_content = parser.modify_m3u8_content.bind(null, params, segment_cache)

  const middleware = {}

  // Access Control
  if (acl_whitelist) {
    acl_whitelist = acl_whitelist.trim().toLowerCase().split(/\s*,\s*/g)

    middleware.connection = (socket) => {
      if (socket && socket.remoteAddress) {
        let remoteIP = socket.remoteAddress.toLowerCase().replace(/^::?ffff:/, '')

        if (acl_whitelist.indexOf(remoteIP) === -1) {
          socket.destroy()
          debug(2, socket.remoteFamily, 'connection blocked by ACL whitelist:', remoteIP)
        }
      }
    }
  }

  // Create an HTTP tunneling proxy
  middleware.request = (req, res) => {
    debug(3, 'proxying (raw):', req.url)

    utils.add_CORS_headers(res)

    const {redirected_base_url, url_type, url, referer_url} = parse_req_url(req)

    if (!url) {
      res.writeHead(400)
      res.end()
      return
    }

    const is_m3u8 = (url_type === 'm3u8')

    const send_cache_segment = function(segment) {
      res.writeHead(200, { "Content-Type": utils.get_content_type(url_type) })
      res.end(segment)
    }

    if (cache_segments && !is_m3u8) {
      let segment = get_segment(url, url_type)  // Buffer (cached segment data), false (prefetch is pending: add callback), undefined (no prefetch is pending)

      if (segment && segment.length) {          // Buffer (cached segment data)
        send_cache_segment(segment)
        return
      }
      else if (segment === false) {             // false (prefetch is pending: add callback)
        add_listener(url, url_type, send_cache_segment)
        return
      }
    }

    const options = get_request_options(url, is_m3u8, referer_url)
    debug(1, 'proxying:', url)
    debug(3, 'm3u8:', (is_m3u8 ? 'true' : 'false'))

    request(options, '', {binary: !is_m3u8, stream: !is_m3u8, cookieJar: cookies.getCookieJar()})
    .then(({redirects, response}) => {
      debug(2, 'proxied response:', {status_code: response.statusCode, headers: response.headers, redirects})

      if (!is_m3u8) {
        response.pipe(res)
      }
      else {
        const m3u8_url = (redirects && Array.isArray(redirects) && redirects.length)
          ? redirects[(redirects.length - 1)]
          : url

        res.writeHead(200, { "Content-Type": "application/x-mpegURL" })
        res.end( modify_m3u8_content(response.toString().trim(), m3u8_url, referer_url, redirected_base_url) )
      }
    })
    .catch((e) => {
      debug(0, 'ERROR:', e.message)
      res.writeHead(500)
      res.end()
    })
  }

  timers.initialize_timers(params)

  return middleware
}

module.exports = get_middleware
