const grep_argv = require('./grep_argv')

const argv_vals = grep_argv({
  "--host":        {},
  "--port":        {num:  true},
  "--tls":         {bool: true},
  "--help":        {bool: true},
  "--req-headers": {file: "json"},
  "--origin":      {},
  "--referer":     {},
  "--useragent":   {},
  "--header":      {many: true},
  "-v":            {num:  true}
}, true)

if (argv_vals["--help"]) {
  console.log(`
usage:
======
hlsd [--help] [--tls] [--host <ip_address>] [--port <number>] [--req-headers <filepath>] [--origin <header>] [--referer <header>] [--useragent <header>] [--header <name=value>] [-v <number>]

examples:
=========
1) print help
     hlsd --help
2) start HTTP proxy at default host:port
     hlsd
3) start HTTP proxy at default host and specific port
     hlsd --port "8080"
4) start HTTP proxy at specific host:port
     hlsd --host "192.168.0.100" --port "8080"
5) start HTTPS proxy at default host:port
     hlsd --tls
6) start HTTPS proxy at specific host:port
     hlsd --host "192.168.0.100" --port "8081" --tls
7) start HTTPS proxy at default host:port
   and include specific HTTP headers in every outbound request
     hlsd --tls --req-headers "/path/to/request/headers.json"
` )
  process.exit(0)
}

if (argv_vals["--origin"] || argv_vals["--referer"] || argv_vals["--useragent"] || argv_vals["--header"].length) {
  argv_vals["--req-headers"] = argv_vals["--req-headers"] || {}

  if (argv_vals["--origin"]) {
    argv_vals["--req-headers"]["Origin"] = argv_vals["--origin"]
  }
  if (argv_vals["--referer"]) {
    argv_vals["--req-headers"]["Referer"] = argv_vals["--referer"]
  }
  if (argv_vals["--useragent"]) {
    argv_vals["--req-headers"]["User-Agent"] = argv_vals["--useragent"]
  }
  argv_vals["--header"].forEach((header) => {
    let parts = header.split(/\s*[:=]\s*/)
    let key, val

    if (parts.length === 2) {
      key = parts[0]
      val = parts[1]
      argv_vals["--req-headers"][key] = val
    }
  })
}

const bootstrap_server = function(start_server) {
  start_server(
    argv_vals["--host"],
    argv_vals["--port"],
    argv_vals["--req-headers"],
    argv_vals["-v"] || 0
  )
}

module.exports = {argv_vals, bootstrap_server}
