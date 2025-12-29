const {URL, decode_component_value} = require('./url')

const get_full_req_url = function(req) {
  return req.originalUrl || req.url
}

const has_req_param = function(req, key) {
  return (req.params && (typeof req.params === 'object') && req.params[key])
}

const has_req_query = function(req, key) {
  return (req.query && (typeof req.query === 'object') && req.query[key])
}

const get_proxy_req_url = function(req) {
  const key = "0"
  return has_req_param(req, key)
    ? `/${req.params[key]}`
    : req.url
}

const get_proxy_req_query = function(req, key, is_base64) {
  if (has_req_param(req, key))
    return decode_component_value(req.params[key], false, is_base64, is_base64)

  if (has_req_query(req, key))
    return decode_component_value(req.query[key], false, is_base64, is_base64)

  const req_url = new URL(get_full_req_url(req))
  return decode_component_value(req_url.searchParams.get(key), true, is_base64, is_base64)
}

const get_base_req_url = function(req) {
  let base_url = ''
  const key = "0"

  if (req.path && has_req_param(req, key)) {
    base_url  = req.baseUrl || ''
    base_url += req.path.substring(0, (req.path.length - req.params[key].length - 1))
  }

  return base_url
}

module.exports = {
  get_full_req_url,
  get_proxy_req_url,
  get_proxy_req_query,
  get_base_req_url
}
