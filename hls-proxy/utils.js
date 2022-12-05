const parse_url = require('url').parse

const regexs = {
  origin: new RegExp('^(https?://[^/]+)(?:/.*)?$', 'i'),
  ts:     new RegExp('\\.ts(?:[\\?#]|$)', 'i')
}

// btoa
const base64_encode = function(str) {
  return Buffer.from(str, 'binary').toString('base64')
}

// atob
const base64_decode = function(str) {
  return Buffer.from(str, 'base64').toString('binary')
}

const add_CORS_headers = function(res) {
  res.setHeader('Access-Control-Allow-Origin',      '*')
  res.setHeader('Access-Control-Allow-Methods',     '*')
  res.setHeader('Access-Control-Allow-Headers',     '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age',           '86400')
}

const debug = function() {
  const args      = [...arguments]
  const params    = args.shift()
  const verbosity = args.shift()
  const append_LF = true

  const {debug_level} = params

  if (append_LF) args.push("\n")

  if (debug_level >= verbosity) {
    console.log.apply(console.log, args)
  }
}

const get_request_options = function(params, url, is_m3u8, referer_url) {
  const {req_headers, req_options, hooks} = params

  const additional_req_options = (hooks && (hooks instanceof Object) && hooks.add_request_options && (typeof hooks.add_request_options === 'function'))
    ? hooks.add_request_options(url, is_m3u8)
    : null

  const additional_req_headers = (hooks && (hooks instanceof Object) && hooks.add_request_headers && (typeof hooks.add_request_headers === 'function'))
    ? hooks.add_request_headers(url, is_m3u8)
    : null

  if (!req_options && !additional_req_options && !req_headers && !additional_req_headers && !referer_url) return url

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

  return request_options
}

const should_prefetch_url = function(params, url) {
  const {hooks, cache_segments} = params

  let do_prefetch = !!cache_segments

  if (do_prefetch) {
    do_prefetch = regexs.ts.test(url)

    if (hooks && (hooks instanceof Object) && hooks.prefetch && (typeof hooks.prefetch === 'function')) {
      const override_prefetch = hooks.prefetch(url)

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
  add_CORS_headers,
  debug,
  get_request_options,
  should_prefetch_url
}
