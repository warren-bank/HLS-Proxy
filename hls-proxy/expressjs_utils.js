const get_full_req_url = function(req) {
  return req.originalUrl || req.url
}

const has_req_param = function(req, key) {
  return (req.params && (typeof req.params === 'object') && req.params[key])
}

const get_proxy_req_url = function(req) {
  const key = "0"
  return has_req_param(req, key)
    ? `/${req.params[key]}`
    : req.url
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
  get_base_req_url
}
