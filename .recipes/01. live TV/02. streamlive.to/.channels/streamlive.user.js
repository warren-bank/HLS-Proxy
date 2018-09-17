// ==UserScript==
// @name streamlive.to
// @description Load many more channels and display only the ones that are free to access.
// @version 0.1.0
// @match *://www.streamlive.to/channels
// @icon https://www.streamlive.to/favicon.ico
// ==/UserScript==

// https://www.chromium.org/developers/design-documents/user-scripts

const payload = function(){
  const $ = window.jQuery
  const channels_to_load = 200

  const filter_channels = function() {
    let channels = $('#loadChannels > div.ml-item')
    channels.each(function(i, el){
      let channel = $(el)
      let quality = channel.find('.mli-quality').text()
      if (quality === 'Premium') channel.remove()
    })
  }

  window.loadChannel = function(){
    window.category = $("#category").val()
    window.language = $("#language").val()
    window.sortBy = $("#sortBy").val()
    window.query = $("#q").val()
    window.itempp = channels_to_load
    if("Find a channel"==query) {
        query = ""
    }
    $("#loadChannels").load(
      "/channelsPages.php",
      {
        "page": window.page,
        "category": window.category,
        "language": window.language,
        "sortBy": window.sortBy,
        "query": window.query,
        "list": window.list,
        "itemspp": window.itempp
      },
      filter_channels
    )
  }

  $(document).ready(function(){
    window.page = 1
    window.loadChannel()
  })
}

const inject_payload = function(){
  let inline, script, head

  inline = document.createTextNode(
    '(' + payload.toString() + ')()'
  )

  script = document.createElement('script')
  script.appendChild(inline)

  head = document.getElementsByTagName('head')[0]
  head.appendChild(script)
}

if (document.readyState === 'complete'){
  inject_payload()
}
else {
  document.onreadystatechange = function(){
    if (document.readyState === 'complete'){
      inject_payload()
    }
  }
}
