const crypto = require('crypto')
const fs     = require('fs')
const path   = require('path')

const {denodeify} = require('@warren-bank/node-request')

const $fs = {
  writeFile: denodeify(fs.writeFile),
  readFile:  denodeify(fs.readFile),
  rm:        denodeify(fs.rm)
}

module.exports = function(dirpath) {

  // synchronous (private)
  const get_random_filename = (state) => {
    let random_bytes, fname, fpath

    while (true) {
      random_bytes = get_random_bytes()
      fname        = convert_random_bytes_to_filename(random_bytes)
      fpath        = path.join(dirpath, fname)

      if (!fs.existsSync(fpath)) {
        state.fpath = fpath
        return
      }
    }
  }

  // synchronous (private)
  const get_random_bytes = () => crypto.randomBytes(30)

  // synchronous (private)
  const convert_random_bytes_to_filename = (buffer) => buffer.toString('base64').replaceAll('/', '_')

  // async
  const set = async (state, blob) => {
    get_random_filename(state)

    await $fs.writeFile(state.fpath, blob)
  }

  // async
  const get = async (state) => {
    return await $fs.readFile(state.fpath, {encoding: null})
  }

  // async
  const remove = async (state) => {
    await $fs.rm(state.fpath, {force: true})
    delete state.fpath
  }

  return {set, get, remove}
}
