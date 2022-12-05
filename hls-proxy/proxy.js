const request = require('@warren-bank/node-request').request
const parser  = require('./manifest_parser')
const utils   = require('./utils')

const regexs = {
  wrap: new RegExp('^(.*)/([^\\._/\\?#]+)(?:[\\._][^/\\?#]*)?(?:[\\?#].*)?$', 'i'),
  m3u8: new RegExp('\\.m3u8(?:[\\?#]|$)', 'i')
}

const get_middleware = function(params) {
  const {is_secure, host, cache_segments, acl_whitelist} = params

  const segment_cache = require('./segment_cache')(params)
  const {get_segment, add_listener} = segment_cache

  const debug               = utils.debug.bind(null, params)
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

    const [url, referer_url] = (() => {
      if (!regexs.wrap.test(req.url))
        return ['', '']

      let url, url_lc, index

      url    = utils.base64_decode( req.url.replace(regexs.wrap, '$2') ).trim()
      url_lc = url.toLowerCase()

      index  = url_lc.indexOf('http')
      if (index !== 0)
        return ['', '']

      index = url_lc.indexOf('|http')
      if (index >=0) {
        const referer_url = url.substring(index + 1, url.length)
        url = url.substring(0, index).trim()
        return [url, referer_url]
      }
      else {
        return [url, '']
      }
    })()

    if (!url) {
      res.writeHead(400)
      res.end()
      return
    }

    const is_m3u8 = regexs.m3u8.test(url)

    const send_ts = function(segment) {
      res.writeHead(200, { "Content-Type": "video/MP2T" })
      res.end(segment)
    }

    if (cache_segments && !is_m3u8) {
      let segment = get_segment(url)   // Buffer (cached segment data), false (prefetch is pending: add callback), undefined (no prefetch is pending)

      if (segment && segment.length) { // Buffer (cached segment data)
        send_ts(segment)
        return
      }
      else if (segment === false) {    // false (prefetch is pending: add callback)
        add_listener(url, send_ts)
        return
      }
    }

    const options = get_request_options(url, is_m3u8, referer_url)
    debug(1, 'proxying:', url)
    debug(3, 'm3u8:', (is_m3u8 ? 'true' : 'false'))

    request(options, '', {binary: !is_m3u8, stream: !is_m3u8})
    .then(({redirects, response}) => {
      debug(2, 'proxied response:', {status_code: response.statusCode, headers: response.headers, redirects})

      if (!is_m3u8) {
        response.pipe(res)
      }
      else {
        const m3u8_url = (redirects && Array.isArray(redirects) && redirects.length)
          ? redirects[(redirects.length - 1)]
          : url

        const redirected_base_url = `${ is_secure ? 'https' : 'http' }://${host || req.headers.host}${req.url.replace(regexs.wrap, '$1')}`

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

  return middleware
}

module.exports = get_middleware
