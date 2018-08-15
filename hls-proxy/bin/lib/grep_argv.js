const fs = require('fs')

// assumes that all arguments are passed with the convention: -key value
// where "-key" is a flag

const grep_argv = function(flags) {
  const args = process.argv.slice(2)
  const vals = {}

  if (args.length > 0) {
    (Object.keys(flags)).forEach((flag) => {
      let index = args.indexOf(flag)
      let val

      if (index >= 0) {
        if (flags[flag] && flags[flag]["bool"]) {
          vals[flag] = true
        }
        else if (index + 1 < args.length) {
          val = args[index + 1]

          if (flags[flag] && flags[flag]["num"]) {
            val = Number(val)

            if (isNaN(val)) val = ""
          }

          if (flags[flag] && flags[flag]["file"]) {
            try {
              val = fs.realpathSync(val, {encoding: 'utf8'})
              val = fs.readFileSync(val, {encoding: 'utf8'})

              if ( (typeof flags[flag]["file"] === "string") && (flags[flag]["file"].toLowerCase() === "json") ) {
                val = JSON.parse(val)
              }
            }
            catch(e){
              val = ""
            }
          }

          if (val !== "") {
            vals[flag] = val
          }
        }
      }
    })
  }

  return vals
}

module.exports = grep_argv
