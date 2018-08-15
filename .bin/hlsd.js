#! /usr/bin/env node

const {argv_vals, bootstrap_server} = require('../bin/process_argv')

const start_server = (argv_vals["--tls"]) ? require('../bin/start_https') : require('../bin/start_http')

bootstrap_server(start_server)
