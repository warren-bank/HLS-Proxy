const fs = require('fs')
const assert = require('assert')

const m3u8_content = fs.readFileSync(__dirname + '/data/chunklist.m3u8', {encoding: 'utf8'})
//console.log(m3u8_content)

const regexs = {
  keys: new RegExp('^(#EXT-X-KEY:[^"]*")([^"]+)(".*)$', 'img')
}

assert.ok(regexs.keys.test(m3u8_content), 'regex is bad: key url not found')

const same_m3u8_content = m3u8_content.replace(regexs.keys, function(match, head, key_url, tail) {
  console.log('key:', key_url)

  return `${head}${key_url}${tail}`
})

assert.equal(m3u8_content, same_m3u8_content, 'm3u8 has been changed!!')
