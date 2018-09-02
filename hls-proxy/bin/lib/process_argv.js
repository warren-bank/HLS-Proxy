const grep_argv = require('./grep_argv')

let argv_vals
try {
  argv_vals = grep_argv({
    "--help":                                 {bool: true},
    "--version":                              {bool: true},

    "--tls":                                  {bool: true},
    "--host":                                 {},
    "--port":                                 {num:  true},

    "--req-headers":                          {file: "json"},
    "--origin":                               {},
    "--referer":                              {},
    "--useragent":                            {},
    "--header":                               {many: true},

    "--req-options":                          {file: "json"},
    "--req-secure-honor-server-cipher-order": {bool: true},
    "--req-secure-ciphers":                   {},
    "--req-secure-protocol":                  {},
    "--req-secure-curve":                     {},

    "--hooks":                                {file: "module"},

    "--prefetch":                             {bool: true},
    "--max-segments":                         {num:  true},
    "--cache-key":                            {num:  true},

    "-v":                                     {num:  true}
  }, true)
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(0)
}

if (argv_vals["--help"]) {
  console.log(`
usage:
======
hlsd [--help] [--version] [--tls] [--host <ip_address>] [--port <number>] [--req-headers <filepath>] [--origin <header>] [--referer <header>] [--useragent <header>] [--header <name=value>] [--req-options <filepath>] [--req-secure-honor-server-cipher-order] [--req-secure-ciphers <string>] [--req-secure-protocol <string>] [--req-secure-curve <string>] [--hooks <filepath>] [--prefetch] [--max-segments <number>] [--cache-key <number>] [-v <number>]

examples:
=========
1) print help
     hlsd --help
2) print version
     hlsd --version
3) start HTTP proxy at default host:port
     hlsd
4) start HTTP proxy at default host and specific port
     hlsd --port "8080"
5) start HTTP proxy at specific host:port
     hlsd --host "192.168.0.100" --port "8080"
6) start HTTPS proxy at default host:port
     hlsd --tls
7) start HTTPS proxy at specific host:port
     hlsd --tls --host "192.168.0.100" --port "8081"
8) start HTTPS proxy at default host:port
   and include specific HTTP headers in every outbound request
     hlsd --tls --req-headers "/path/to/request/headers.json"
9) start HTTPS proxy at default host:port
   and enable prefetch of 10 video segments
     hlsd --tls --prefetch --max-segments 10
` )
  process.exit(0)
}

if (argv_vals["--version"]) {
  let data = require('../../../package.json')
  console.log(data.version)
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

// =============================================================================
// references:
// =============================================================================
//   https://stackoverflow.com/a/44635449
//   https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options
//   https://www.openssl.org/docs/man1.1.0/ssl/ssl.html#Dealing-with-Protocol-Methods
//   https://www.openssl.org/docs/man1.1.0/ssl/SSL_CTX_new.html
// =============================================================================
if (argv_vals["--req-secure-honor-server-cipher-order"] || argv_vals["--req-secure-ciphers"] || argv_vals["--req-secure-protocol"] || argv_vals["--req-secure-curve"]) {
  argv_vals["--req-options"] = argv_vals["--req-options"] || {}

  if (argv_vals["--req-secure-honor-server-cipher-order"]) {
    argv_vals["--req-options"]["honorCipherOrder"] = true
  }
  if (argv_vals["--req-secure-ciphers"]) {
    argv_vals["--req-options"]["ciphers"] = argv_vals["--req-secure-ciphers"]
  }
  if (argv_vals["--req-secure-protocol"]) {
    argv_vals["--req-options"]["secureProtocol"] = argv_vals["--req-secure-protocol"]
  }
  if (argv_vals["--req-secure-curve"]) {
    argv_vals["--req-options"]["ecdhCurve"] = argv_vals["--req-secure-curve"]
  }
}

const bootstrap_server = function(start_server) {
  start_server({
    host:           argv_vals["--host"],
    port:           argv_vals["--port"],
    req_headers:    argv_vals["--req-headers"],
    req_options:    argv_vals["--req-options"],
    hooks:          argv_vals["--hooks"],
    cache_segments: argv_vals["--prefetch"],
    max_segments:   argv_vals["--max-segments"] || 20,
    cache_key:      argv_vals["--cache-key"]    ||  0,
    verbosity:      argv_vals["-v"]             ||  0
  })
}

module.exports = {argv_vals, bootstrap_server}
