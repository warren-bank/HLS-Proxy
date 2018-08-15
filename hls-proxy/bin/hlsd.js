#! /usr/bin/env node

const {argv_vals, bootstrap_server} = require('./lib/process_argv')

const start_server = (argv_vals["--tls"]) ? require('../servers/start_https') : require('../servers/start_http')

bootstrap_server(start_server)
