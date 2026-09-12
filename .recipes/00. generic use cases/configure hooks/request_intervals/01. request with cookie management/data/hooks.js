module.exports = {
  request_intervals: (add_request_interval) => {

    const cookie_name = 'timestamp'

    const get_24_hhmmss = () => (new Date()).toTimeString().replace(/\s.*$/, '')

    const get_24_hhmmss_url_setter = () => `http://httpbin.org/cookies/set/${cookie_name}/${encodeURIComponent(get_24_hhmmss())}`

    const get_24_hhmmss_url_getter = () => 'http://httpbin.org/cookies'

    add_request_interval(
      0, // run timer once at startup to initialize cookies
      (request) => {
        request(get_24_hhmmss_url_setter(), null, {followRedirect: false, validate_status_code: false})
      }
    )

    add_request_interval(
      (1000 * 30), // run timer at 30 second interval to refresh cookies
      (request) => {
        request(get_24_hhmmss_url_setter(), null, {followRedirect: false, validate_status_code: false})
      }
    )

    add_request_interval(
      (1000 * 10), // run timer at 10 second interval to display cookies
      (request) => {
        request(get_24_hhmmss_url_getter())
        .then(({response}) => console.log(response.toString()))
      }
    )

  }
}
