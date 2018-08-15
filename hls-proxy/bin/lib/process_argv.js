const grep_argv = require('./grep_argv')

const argv_vals = grep_argv({
  "--host":        {},
  "--port":        {num:  true},
  "--tls":         {bool: true},
  "--help":        {bool: true},
  "--req-headers": {file: "json"}
})

if (argv_vals["--help"]) {
  console.log(`
usage examples:
===============
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

const bootstrap_server = function(start_server) {
  start_server(
    argv_vals["--host"],
    argv_vals["--port"],
    argv_vals["--req-headers"]
  )
}

module.exports = {argv_vals, bootstrap_server}
