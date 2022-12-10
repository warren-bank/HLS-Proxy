const request = require('@warren-bank/node-request').request
const cookies = require('./cookies')
const utils   = require('./utils')

const initialize_timers = function(params) {
  const {hooks} = params

  if (hooks && (hooks instanceof Object) && hooks.request_intervals && (typeof hooks.request_intervals === 'function')) {
    cookies.useCookieJar()

    const get_request_options = utils.get_request_options.bind(null, params)

    const request_wrapper = function(url, POST_data, user_config) {
      const options = get_request_options(url, /* is_m3u8= */ false, /* referer_url= */ null)
      const config  = Object.assign(
        {},
        (user_config || {}),
        {
          cookieJar: cookies.getCookieJar()
        }
      )

      return request(options, POST_data, config)
    }

    const add_request_interval = function(delay_ms, callback) {
      if (!delay_ms || (typeof delay_ms !== 'number') || isNaN(delay_ms) || (delay_ms < 0)) {
        callback(request_wrapper)
      }
      else {
        setInterval(
          callback.bind(null, request_wrapper),
          delay_ms
        )
      }
    }

    hooks.request_intervals(add_request_interval)
  }
}

module.exports = {
  initialize_timers
}
