const expressjs = require('./expressjs_utils')
const {URL}     = require('./url')

const get_decoded_qs_password = function(req) {
  return expressjs.get_proxy_req_query(req, 'password', false)
}

const is_allowed = function(params, req) {
  const {acl_pass} = params

  if (acl_pass && Array.isArray(acl_pass) && acl_pass.length) {
    const password = get_decoded_qs_password(req)

    return (acl_pass.indexOf(password) >= 0)
  }

  return true
}

module.exports = {
  get_decoded_qs_password,
  is_allowed
}
