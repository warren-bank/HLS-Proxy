const process_argv = require('@warren-bank/node-process-argv')

const {HttpProxyAgent, HttpsProxyAgent} = require('hpagent')

const {normalize_req_headers} = require('../../utils')

const argv_flags = {
  "--help":                                 {bool: true},
  "--version":                              {bool: true},

  "--tls":                                  {bool: true},
  "--host":                                 {},
  "--port":                                 {num:  "int"},

  "--copy-req-headers":                     {bool: true},
  "--req-headers":                          {file: "json"},
  "--origin":                               {},
  "--referer":                              {},
  "--useragent":                            {},
  "--header":                               {many: true},

  "--req-options":                          {file: "json"},
  "--req-insecure":                         {bool: true},
  "--req-secure-honor-server-cipher-order": {bool: true},
  "--req-secure-ciphers":                   {},
  "--req-secure-protocol":                  {},
  "--req-secure-curve":                     {},

  "--hooks":                                {file: "module"},

  "--prefetch":                             {bool: true},
  "--max-segments":                         {num:  "int"},
  "--cache-timeout":                        {num:  "int"},
  "--cache-key":                            {num:  "int"},
  "--cache-storage":                        {enum: ["memory", "filesystem"]},
  "--cache-storage-fs-dirpath":             {file: "path-exists"},

  "-v":                                     {num:  "int"},
  "--acl-ip":                               {},
  "--acl-pass":                             {},
  "--block-req-hostname":                   {},
  "--allow-private-req-hostnames":          {bool: true},
  "--http-proxy":                           {},

  "--tls-cert":                             {file: "path-exists"},
  "--tls-key":                              {file: "path-exists"},
  "--tls-pass":                             {file: "path-exists"},

  "--manifest-extension":                   {},
  "--segment-extension":                    {}
}

const argv_flag_aliases = {
  "--help":                                 ["-h"],
  "--acl-ip":                               ["--acl-whitelist"],
  "--http-proxy":                           ["--https-proxy", "--proxy"]
}

let argv_vals = {}

try {
  argv_vals = process_argv(argv_flags, argv_flag_aliases)
}
catch(e) {
  console.log('ERROR: ' + e.message)
  process.exit(1)
}

if (argv_vals["--help"]) {
  const help = require('./help')
  console.log(help)
  process.exit(0)
}

if (argv_vals["--version"]) {
  let data = require('../../../package.json')
  console.log(data.version)
  process.exit(0)
}

if (argv_vals["--origin"] || argv_vals["--referer"] || argv_vals["--useragent"] || (Array.isArray(argv_vals["--header"]) && argv_vals["--header"].length)) {
  argv_vals["--req-headers"] = normalize_req_headers( argv_vals["--req-headers"] || {} )

  if (argv_vals["--origin"]) {
    argv_vals["--req-headers"]["origin"] = argv_vals["--origin"]
  }
  if (argv_vals["--referer"]) {
    argv_vals["--req-headers"]["referer"] = argv_vals["--referer"]
  }
  if (argv_vals["--useragent"]) {
    argv_vals["--req-headers"]["user-agent"] = argv_vals["--useragent"]
  }
  if (Array.isArray(argv_vals["--header"]) && argv_vals["--header"].length) {
    let split = function(str, sep) {
      let chunks, start

      chunks = str.split(sep, 2)
      if (chunks.length !== 2) return chunks

      start = chunks[0].length
      start = chunks[1] ? str.indexOf(chunks[1], start) : -1

      if (start === -1)
        delete chunks[1]
      else
        chunks[1] = str.substr(start)

      return chunks
    }

    argv_vals["--header"].forEach((header) => {
      let parts = split(header, /\s*[:=]\s*/g)
      let key, val

      if (parts.length === 2) {
        key = parts[0].toLowerCase()
        val = parts[1]
        argv_vals["--req-headers"][key] = val
      }
    })
  }
}

// =============================================================================
// references:
// =============================================================================
//   https://nodejs.org/api/cli.html#cli_environment_variables
//   https://nodejs.org/api/cli.html#cli_node_tls_reject_unauthorized_value
// =============================================================================
if (argv_vals["--req-insecure"]) {
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0
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

if (argv_vals["--req-options"] && argv_vals["--req-options"]["headers"])
  argv_vals["--req-options"]["headers"] = normalize_req_headers( argv_vals["--req-options"]["headers"] )

if (typeof argv_vals["--max-segments"] !== 'number')
  argv_vals["--max-segments"] = 20

if (typeof argv_vals["--cache_timeout"] !== 'number')
  argv_vals["--cache_timeout"] = 60

if (typeof argv_vals["--cache-key"] !== 'number')
  argv_vals["--cache-key"] = 0

if (typeof argv_vals["-v"] !== 'number')
  argv_vals["-v"] = 0

if (argv_vals["--acl-ip"]) {
  argv_vals["--acl-ip"] = argv_vals["--acl-ip"].trim().toLowerCase().split(/\s*,\s*/g)
}

if (argv_vals["--acl-pass"]) {
  argv_vals["--acl-pass"] = argv_vals["--acl-pass"].trim().split(/\s*,\s*/g)
}

if (argv_vals["--block-req-hostname"]) {
  const blacklist = argv_vals["--block-req-hostname"].trim().toLowerCase().split(/\s*,\s*/g)

  argv_vals["--block-req-hostname"] = {
    includes:   [],
    startsWith: [],
    endsWith:   [],
    match:      [],
    equals:     []
  }

  for (const item of blacklist) {
    if (!item) continue

    const globStart  = item.startsWith('*')
    const globEnd    = item.endsWith('*')
    const regexStart = item.startsWith('/')
    const regexEnd   = item.endsWith('/')

    if (globStart && globEnd) {
      if (item.length > 2) {
        argv_vals["--block-req-hostname"].includes.push(
          item.substring(1, item.length - 1)
        )
      }
      continue
    }
    if (globEnd) {
      if (item.length > 1) {
        argv_vals["--block-req-hostname"].startsWith.push(
          item.substring(0, item.length - 1)
        )
      }
      continue
    }
    if (globStart) {
      if (item.length > 1) {
        argv_vals["--block-req-hostname"].endsWith.push(
          item.substring(1, item.length)
        )
      }
      continue
    }
    if (regexStart && regexEnd) {
      if (item.length > 2) {
        try {
          const regex = new RegExp(item.substring(1, item.length - 1))

          argv_vals["--block-req-hostname"].match.push(
            regex
          )
        }
        catch(ignored) {}
      }
      continue
    }
    else {
      argv_vals["--block-req-hostname"].equals.push(
        item
      )
    }
  }
}

if (!argv_vals["--allow-private-req-hostnames"]) {
  if (!argv_vals["--block-req-hostname"]) {
    argv_vals["--block-req-hostname"] = {
      includes:   [],
      startsWith: [],
      endsWith:   [],
      match:      [],
      equals:     []
    }
  }
  argv_vals["--block-req-hostname"].match.push(
    /^(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/,
    /^(fe80:|fc|fd|::ffff:(0\.|10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.))/
  )
  argv_vals["--block-req-hostname"].equals.push(
    'localhost',
    '::1'
  )
}

if (argv_vals["--block-req-hostname"]) {
  if (
    !argv_vals["--block-req-hostname"].includes.length   &&
    !argv_vals["--block-req-hostname"].startsWith.length &&
    !argv_vals["--block-req-hostname"].endsWith.length   &&
    !argv_vals["--block-req-hostname"].match.length      &&
    !argv_vals["--block-req-hostname"].equals.length
  ) {
    argv_vals["--block-req-hostname"] = null
  }
}

if (argv_vals["--http-proxy"]) {
  const proxy_options = {
    keepAlive:      true,
    keepAliveMsecs: 1000,
    maxSockets:     256,
    maxFreeSockets: 256,
    proxy:          argv_vals["--http-proxy"]
  }

  argv_vals["--http-proxy"] = {
    "http:":  new HttpProxyAgent( proxy_options),
    "https:": new HttpsProxyAgent(proxy_options)
  }
}

module.exports = argv_vals
