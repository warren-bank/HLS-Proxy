module.exports = {
  request_intervals: (add_request_interval) => {

    let counter = 0

    add_request_interval(
      (1000 * 5), // run timer at 5 second interval
      (request) => {
        counter++
        console.log('interval #:', counter)
      },
      (1000 * 30), // stop after 30 seconds
    )

  }
}
