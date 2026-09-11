const request = require('@warren-bank/node-request').request
const cookies = require('./cookies')
const utils   = require('./utils')

const initialize_timers = function(params) {
  const {hooks} = params

  if (hooks && (hooks instanceof Object) && hooks.request_intervals && (typeof hooks.request_intervals === 'function')) {
    cookies.useCookieJar()

    const get_request_options = utils.get_request_options.bind(null, params)

    const request_wrapper = function(url, POST_data, user_config) {
      const options = get_request_options(url, /* is_m3u8= */ false, /* referer_url= */ null, /* querystring_req_headers= */ null, /* inbound_req_headers= */ null)
      const config  = Object.assign(
        {},
        (user_config || {}),
        {
          cookieJar: cookies.getCookieJar()
        }
      )

      return request(options, POST_data, config)
    }

    const add_request_interval = function(delay_ms, callback, max_duration_ms) {
      if (!delay_ms || (typeof delay_ms !== 'number') || isNaN(delay_ms) || (delay_ms < 0)) {
        callback(request_wrapper)
      }
      else {
        if (max_duration_ms && ((typeof max_duration_ms !== 'number') || (max_duration_ms < 0)))
          max_duration_ms = 0

        const start_time_ms = max_duration_ms
          ? Date.now()
          : null

        const callback_wrapper = () => {
          if (max_duration_ms && ((Date.now() - start_time_ms) > max_duration_ms))
            clearInterval(timer_id)
          else
            callback(request_wrapper, timer_id)
        }

        const timer_id = setInterval(
          callback_wrapper,
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
