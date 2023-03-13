const parse_url = require('@warren-bank/url').parse
const expressjs = require('./expressjs_utils')

const regexs = {
  req_url: new RegExp('^(.*?)/([a-zA-Z0-9\\+/=%]+)(?:[\\._]([^/\\?#]*))?(?:[\\?#].*)?$'),
  origin:  new RegExp('^(https?://[^/]+)(?:/.*)?$', 'i')
}

// btoa
const base64_encode = function(str) {
  return Buffer.from(str, 'binary').toString('base64')
}

// atob
const base64_decode = function(str) {
  return Buffer.from(str, 'base64').toString('binary')
}

const parse_req_url = function(params, req) {
  const {is_secure, host} = params

  const result = {redirected_base_url: '', url_type: '', url: '', referer_url: ''}

  const matches = regexs.req_url.exec( expressjs.get_proxy_req_url(req) )

  if (matches) {
    result.redirected_base_url = `${ is_secure ? 'https' : 'http' }://${host || req.headers.host}${expressjs.get_base_req_url(req) || matches[1] || ''}`

    if (matches[3])
      result.url_type = matches[3].toLowerCase().trim()

    let url, url_lc, index

    url    = base64_decode( decodeURIComponent( matches[2] ) ).trim()
    url_lc = url.toLowerCase()
    index  = url_lc.indexOf('http')

    if (index === 0) {
      index = url_lc.indexOf('|http')

      if (index > 0) {
        result.referer_url = url.substring(index + 1, url.length)

        url = url.substring(0, index).trim()
      }
      result.url = url
    }
  }

  return result
}

const get_content_type = function(url_type) {
  let content_type
  switch(url_type) {
    case 'm3u8':
      content_type = 'application/x-mpegurl'
      break
    case 'ts':
      content_type = 'video/MP2T'
      break
    case 'json':
      content_type = 'application/json'
      break
    case 'key':
    case 'other':
    default:
      content_type = 'application/octet-stream'
      break
  }
  return content_type
}

const add_CORS_headers = function(res) {
  res.setHeader('Access-Control-Allow-Origin',      '*')
  res.setHeader('Access-Control-Allow-Methods',     '*')
  res.setHeader('Access-Control-Allow-Headers',     '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age',           '86400')
}

const debug = function() {
  let args        = [...arguments]
  const params    = args.shift()
  const verbosity = args.shift()
  const append_LF = true

  const {debug_level} = params

  if (append_LF) args.push("\n")

  if (debug_level >= verbosity) {
    args = args.map(arg => (typeof arg === 'string') ? arg : JSON.stringify(arg, null, 2))

    console.log.apply(console.log, args)
  }
}

const get_request_options = function(params, url, is_m3u8, referer_url) {
  const {req_headers, req_options, hooks, http_proxy} = params

  const additional_req_options = (hooks && (hooks instanceof Object) && hooks.add_request_options && (typeof hooks.add_request_options === 'function'))
    ? hooks.add_request_options(url, is_m3u8)
    : null

  const additional_req_headers = (hooks && (hooks instanceof Object) && hooks.add_request_headers && (typeof hooks.add_request_headers === 'function'))
    ? hooks.add_request_headers(url, is_m3u8)
    : null

  if (!req_options && !http_proxy && !additional_req_options && !req_headers && !additional_req_headers && !referer_url) return url

  const request_options = Object.assign(
    {},
    parse_url(url),
    (req_options            || {}),
    (additional_req_options || {})
  )

  request_options.headers = Object.assign(
    {},
    ((           req_options &&            req_options.headers) ?            req_options.headers : {}),
    ((additional_req_options && additional_req_options.headers) ? additional_req_options.headers : {}),
    (req_headers             || {}),
    (additional_req_headers  || {}),
    (referer_url ? {"referer": referer_url, "origin": referer_url.replace(regexs.origin, '$1')} : {})
  )

  // normalize
  if (request_options.protocol)
    request_options.protocol = request_options.protocol.toLowerCase()

  if (!request_options.agent && http_proxy && request_options.protocol && http_proxy[request_options.protocol])
    request_options.agent = http_proxy[request_options.protocol]

  return request_options
}

const should_prefetch_url = function(params, url, url_type) {
  const {hooks, cache_segments} = params

  let do_prefetch = !!url && !!cache_segments

  if (do_prefetch) {
    do_prefetch = (url_type === 'ts') || (url_type === 'key')

    if (hooks && (hooks instanceof Object) && hooks.prefetch && (typeof hooks.prefetch === 'function')) {
      const override_prefetch = hooks.prefetch(url, url_type)

      if ((typeof override_prefetch === 'boolean') && (override_prefetch !== do_prefetch)) {
        debug(params, 3, 'prefetch override:', (override_prefetch ? 'allow' : 'deny'), url)
        do_prefetch = override_prefetch
      }
    }
  }
  return do_prefetch
}

module.exports = {
  base64_encode,
  base64_decode,
  parse_req_url,
  get_content_type,
  add_CORS_headers,
  debug,
  get_request_options,
  should_prefetch_url
}
