const regexp_indices = require('../../hls-proxy/regexp_indices')

const str    = 'foo_bar_baz'
const regexp = regexp_indices.updateRegExp(new RegExp(str))
const match  = regexp_indices.exec(regexp, str)

console.log(
  (match.indices && (match.indices.length === 1) && (match.indices[0][0] === 0) && (match.indices[0][1] === str.length)) ? 'OK' : 'FAIL'
)
