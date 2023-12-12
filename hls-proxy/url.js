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

module.exports = {
  parse,
  URL
}
