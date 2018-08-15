const os = require('os')
const ifaces = os.networkInterfaces()

const IP = []

Object.keys(ifaces).forEach(function (ifname) {
  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return
    }
    IP.push([iface.address, ifname])
  })
})

const prompt_user_to_choose_one_IP = function(cb) {
  if (IP.length === 0) return cb(false)
  if (IP.length === 1) return cb(IP[0][0])

  console.log('Please select one of the available network addresses to use for "host":')
  for (var i=0; i<IP.length; i++) {
    console.log(`    ${i+1}) ${IP[i][0]} (${IP[i][1]})`)
  }
  console.log()

  const replay_prompt = function() {
    console.log('Please enter the number corresponding to your selection:')
  }

  replay_prompt()

  //Start reading input
  process.stdin.resume()
  process.stdin.setEncoding('utf8')

  process.stdin.on('data', function (text) {
    console.log()

    text = text.trim()
    if (!text) return replay_prompt()

    var num = Number(text)
    if ( (typeof num !== 'number') || (isNaN(num)) ) return replay_prompt()

    num--
    if (num < 0 || num >= IP.length) {
      console.log('The number entered is outside the range of valid options.')
      return replay_prompt()
    }

    //Stop reading input
    process.stdin.pause()

    cb(IP[num][0])
  })
}

module.exports = {IP, prompt: prompt_user_to_choose_one_IP}
