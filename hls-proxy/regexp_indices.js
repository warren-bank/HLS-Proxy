require('regexp-match-indices/config').mode = 'spec-compliant'

const state = {
  'native':   require('regexp-match-indices/native'),
  'polyfill': require('regexp-match-indices/implementation')
}

const setExecImplementation = function() {
  try {
    const str = 'foo_bar_baz'

    const regex = new RegExp(str, 'd')
    if (!regex.hasIndices) throw ''

    const match = regex.exec(str)
    if (!(match.indices && (match.indices.length === 1) && (match.indices[0][0] === 0) && (match.indices[0][1] === str.length))) throw ''

    state.implementation = state['native']
    state.isNative   = true
    state.isPolyfill = false
  }
  catch(e) {
    state.implementation = state['polyfill']
    state.isNative   = false
    state.isPolyfill = true
  }
}

setExecImplementation()

const exec = function(regex, string) {
  if (state.isNative)
    regex = updateRegExp(regex)

  return state.implementation.call(regex, string)
}

const updateRegExp = function(regex) {
  return (state.isPolyfill || !state.isNative || regex.hasIndices)
    ? regex
    : new RegExp(
        regex.source,
        ((regex.flags || '') + 'd')
      )
}

module.exports = {
  exec,
  updateRegExp
}
