module.exports = {
  request_intervals: (add_request_interval) => {

    let counter = 0
    const max_counter = 5

    add_request_interval(
      (1000 * 5), // run timer at 5 second interval
      (request, context) => {
        counter++
        console.log('interval #:', counter)

        if (counter >= max_counter)
          clearInterval(context.timer_id)
      }
    )

  }
}
