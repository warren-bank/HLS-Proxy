const expressjs = require('./expressjs_utils')
const {parse: parse_url, decode_component_value: decode_url_component_value} = require('./url')

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
  const {is_secure, host, manifest_extension, segment_extension, hooks} = params

  const result = {redirected_base_url: '', url_type: '', url: '', referer_url: '', querystring_req_headers: null}

  const matches = regexs.req_url.exec( expressjs.get_proxy_req_url(req) )

  if (matches) {
    result.redirected_base_url = `${ (is_secure || (host && host.endsWith(':443'))) ? 'https' : 'http' }://${host || req.headers.host}${expressjs.get_base_req_url(req) || matches[1] || ''}`

    if (matches[3]) {
      result.url_type = matches[3].toLowerCase().trim()

      if (manifest_extension && (result.url_type === manifest_extension))
        result.url_type = 'm3u8'

      if (segment_extension && (result.url_type === segment_extension))
        result.url_type = 'ts'
    }

    let url, url_lc, index

    url    = base64_decode( decode_url_component_value( matches[2], true, true, true ) ).trim()
    url_lc = url.toLowerCase()
    index  = url_lc.indexOf('http')

    if (index === 0) {
      index = url_lc.indexOf('|http')

      if (index > 0) {
        result.referer_url = url.substring(index + 1, url.length)

        url = url.substring(0, index).trim()
      }

      if (hooks && (hooks instanceof Object) && hooks.rewrite && (typeof hooks.rewrite === 'function'))
        url = hooks.rewrite(url)

      result.url = url
    }

    let qs_headers = expressjs.get_proxy_req_query(req, 'headers', true)
    if (qs_headers) {
      try {
        qs_headers = base64_decode( qs_headers ).trim()
        qs_headers = JSON.parse(qs_headers)

        if (qs_headers && (qs_headers instanceof Object))
          result.querystring_req_headers = qs_headers
      }
      catch(e) {}
    }
  }

  return result
}

const get_content_type = function(data) {
  let content_type

  if (!content_type && data && (typeof data === 'object') && data['content-type'])
    content_type = data['content-type']

  if (!content_type && data && (typeof data === 'string'))
    content_type = get_content_type_from_url_type(data)

  return content_type
}

const get_content_type_from_url_type = function(url_type) {
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

const normalize_req_headers = function(req_headers, blacklist) {
  const normalized = {}

  if (blacklist && !Array.isArray(blacklist))
    blacklist = null
  if (blacklist)
    blacklist = blacklist.filter(val => val && (typeof val === 'string')).map(val => val.toLowerCase())
  if (blacklist && !blacklist.length)
    blacklist = null

  for (let name in req_headers) {
    const lc_name = name.toLowerCase()

    if (!blacklist || (blacklist.indexOf(lc_name) === -1))
      normalized[lc_name] = req_headers[name]
  }

  return normalized
}

const get_request_options = function(params, url, is_m3u8, referer_url, querystring_req_headers, inbound_req_headers) {
  const {copy_req_headers, req_headers, req_options, hooks, http_proxy} = params

  const copied_req_headers = (copy_req_headers && inbound_req_headers && (inbound_req_headers instanceof Object))
    ? normalize_req_headers(inbound_req_headers, ['host', 'accept-encoding'])
    : null

  const additional_req_options = (hooks && (hooks instanceof Object) && hooks.add_request_options && (typeof hooks.add_request_options === 'function'))
    ? hooks.add_request_options(url, is_m3u8)
    : null

  const additional_req_headers = (hooks && (hooks instanceof Object) && hooks.add_request_headers && (typeof hooks.add_request_headers === 'function'))
    ? hooks.add_request_headers(url, is_m3u8)
    : null

  if (!req_options && !http_proxy && !additional_req_options && !copied_req_headers && !req_headers && !additional_req_headers && !referer_url && !querystring_req_headers) return url

  const request_options = Object.assign(
    {},
    parse_url(url),
    (req_options            || {}),
    (additional_req_options || {})
  )

  request_options.headers = Object.assign(
    {},
    (copied_req_headers      || {}),
    ((           req_options &&            req_options.headers) ?            req_options.headers : {}),
    ((additional_req_options && additional_req_options.headers) ? additional_req_options.headers : {}),
    (req_headers             || {}),
    (additional_req_headers  || {}),
    (referer_url ? {"referer": referer_url, "origin": referer_url.replace(regexs.origin, '$1')} : {}),
    (querystring_req_headers || {})
  )

  // normalize
  if (request_options.protocol)
    request_options.protocol = request_options.protocol.toLowerCase()

  if (!request_options.agent && http_proxy && request_options.protocol && http_proxy[request_options.protocol])
    request_options.agent = http_proxy[request_options.protocol]

  return request_options
}

const block_request_options = function(params, request_options) {
  const {block_req_hostname} = params

  // short circuit
  if (!block_req_hostname || !Array.isArray(block_req_hostname) || !block_req_hostname.length || !request_options)
    return false

  // special case: url
  if (typeof request_options === 'string')
    request_options = parse_url(request_options)

  // sanity check
  if (!request_options.hostname || (typeof request_options.hostname !== 'string'))
    return false

  return (block_req_hostname.indexOf(request_options.hostname.toLowerCase()) >= 0)
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
  normalize_req_headers,
  get_request_options,
  block_request_options,
  should_prefetch_url
}
