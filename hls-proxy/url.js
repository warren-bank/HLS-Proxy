let parse, URL

if (!parse || !URL) {
  try {
    ({parse, URL} = require('@warren-bank/url/es6-node/jsURL'));
  }
  catch(e){}
}

if (!parse || !URL) {
  try {
    ({parse, URL} = require('@warren-bank/url/es5-browser/jsURL'));
  }
  catch(e){}
}

if (!parse || !URL) {
  try {
    ({parse, URL} = require('url'));
  }
  catch(e){}
}

if (!parse || !URL) {
  throw new Error('URL class is not supported')
}

const decode_component_value = function(value, decode = true, fix_unsafe_url_base64_encoding = false, fix_safe_url_base64_encoding = false) {
  value = value || ''

  if (decode)
    value = decodeURIComponent(value)

  if (fix_unsafe_url_base64_encoding)
    value = value.replace(/ /g, '+')

  if (fix_safe_url_base64_encoding)
    value = value.replace(/-/g, '+').replace(/_/g, '/')

  return value
}

module.exports = {
  parse,
  URL,
  decode_component_value
}
