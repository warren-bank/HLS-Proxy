const expressjs = require('./expressjs_utils')
const {URL}     = require('./url')

const get_encoded_qs_password = function(req) {
  const req_url = new URL( expressjs.get_full_req_url(req) )

  return req_url.searchParams.get('password') || ''
}

const is_allowed = function(params, req) {
  const {acl_pass} = params

  if (acl_pass && Array.isArray(acl_pass) && acl_pass.length) {
    const password = decodeURIComponent( get_encoded_qs_password(req) )

    return (acl_pass.indexOf(password) >= 0)
  }

  return true
}

module.exports = {
  get_encoded_qs_password,
  is_allowed
}
