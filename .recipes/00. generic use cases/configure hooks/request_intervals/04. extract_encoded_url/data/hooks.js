module.exports = {
  request_intervals: (add_request_interval) => {

    const proxy_url = 'http://127.0.0.1:8080/aHR0cHM6Ly9odHRwYmluLm9yZy9oZWFkZXJz.json'

    add_request_interval(
      0, // run timer once
      (request, context) => {
        const encoded_url = context.extract_encoded_url(proxy_url)

        console.log('encoded url:', encoded_url)
      }
    )

  }
}
