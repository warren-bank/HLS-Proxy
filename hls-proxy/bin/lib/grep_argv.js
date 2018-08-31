const fs = require('fs')

// assumes that all arguments are passed with the convention: -key value
// where "-key" is a flag

const retrieve_flag_value = function(flag_opts, args, index, throw_error_if_value_matches_any_flag_key, flag_keys) {
  let val

  if (index >= 0) {
    if (flag_opts && flag_opts["bool"]) {
      val = true
    }
    else if (index + 1 < args.length) {
      val = args[index + 1]

      if (throw_error_if_value_matches_any_flag_key && (flag_keys.indexOf(val) >= 0)) {
        throw new Error('The command-line contains option ' + val + ' at a position where a value for the previous option ' + args[index] + ' is expected.')
      }

      if (flag_opts && flag_opts["num"]) {
        val = Number(val)

        if (isNaN(val)) val = ""
      }

      if (flag_opts && flag_opts["file"]) {
        try {
          val = fs.realpathSync(val, {encoding: 'utf8'})

          if ( (typeof flag_opts["file"] === "string") && (flag_opts["file"].toLowerCase() === "module") ) {
            val = require(val)
          }
          else {
            val = fs.readFileSync(val, {encoding: 'utf8'})

            if ( (typeof flag_opts["file"] === "string") && (flag_opts["file"].toLowerCase() === "json") ) {
              val = JSON.parse(val)
            }
          }
        }
        catch(e){
          val = ""
        }
      }
    }
  }

  if (val === "") val = undefined

  return val
}

const grep_argv = function(flags, throw_error_if_value_matches_any_flag_key) {
  const args      = process.argv.slice(2)
  const flag_keys = Object.keys(flags)
  const vals = {}

  if (args.length > 0) {
    flag_keys.forEach((flag) => {
      let flag_opts = flags[flag]
      let is_array  = flag_opts && flag_opts["many"]
      let index     = args.indexOf(flag)
      let val

      if (!is_array) {
        val = retrieve_flag_value(flag_opts, args, index, throw_error_if_value_matches_any_flag_key, flag_keys)

        if (val !== undefined) {
          vals[flag] = val
        }
      }
      else {
        vals[flag] = []

        while (index >=0) {
          val = retrieve_flag_value(flag_opts, args, index, throw_error_if_value_matches_any_flag_key, flag_keys)

          if (val !== undefined) {
            vals[flag].push(val)
          }

          index = args.indexOf(flag, (index + 1))
        }
      }
    })
  }

  return vals
}

module.exports = grep_argv
