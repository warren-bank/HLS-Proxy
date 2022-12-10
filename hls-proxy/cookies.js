const {CookieJar} = require('tough-cookie')

let cookieJar = null

const useCookieJar = function(){
  if (!cookieJar)
    cookieJar = new CookieJar()
}

const getCookieJar = function(){
  return cookieJar
}

module.exports = {
  useCookieJar,
  getCookieJar
}
