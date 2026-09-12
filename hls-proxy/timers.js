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

    const extract_encoded_url = function(url) {
      const result = utils.parse_req_url(params, {url, headers: {}})

      return (result && result.url)
        ? result.url
        : null
    }

    const internal_filesystem_segment_cache = get_internal_filesystem_segment_cache(params)

    const add_request_interval = function(delay_ms, callback, max_duration_ms) {
      if (!delay_ms || (typeof delay_ms !== 'number') || isNaN(delay_ms) || (delay_ms < 0)) {
        callback(request_wrapper, {
          extract_encoded_url,
          internal_filesystem_segment_cache
        })
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
            callback(request_wrapper, {
              timer_id,
              extract_encoded_url,
              internal_filesystem_segment_cache
            })
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

const has_filesystem_segment_cache = function(params) {
  const {cache_storage, cache_storage_fs_dirpath} = params

  return (cache_storage && (cache_storage === 'filesystem') && cache_storage_fs_dirpath)
}

const get_internal_filesystem_segment_cache = function(params) {
  return has_filesystem_segment_cache(params)
    ? require('./segment_cache')({expose_internals: true})
    : null
}

module.exports = {
  initialize_timers
}
