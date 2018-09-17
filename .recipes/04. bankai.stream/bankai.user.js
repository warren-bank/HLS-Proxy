// ==UserScript==
// @name Bankai Stream
// @description Escape iframe and display information about stream
// @version 0.2.0
// @match *://bankai.stream/*
// @icon http://bankai.stream/favicon.ico
// ==/UserScript==

// https://www.chromium.org/developers/design-documents/user-scripts

var payload = function(){
  if (top.location != self.location){
    top.location = self.location.href
  }
  else {
    try {
      // extract configuration from global instance of Clappr player
      if (window.player && window.player._options && window.player._options.source && (window.player._options.source.toLowerCase().indexOf('.m3u8') >= 0)) {
        let video_url = window.player._options.source

        let msg = ''
        msg += 'video stream:'    + "\n"
        msg += '============='    + "\n"
        msg += video_url          + "\n\n"

        msg += 'video stream (HLS-Proxy):' + "\n"
        msg += '=========================' + "\n"
        msg += '( adaptive) '
        msg += 'http://gitcdn.link/cdn/warren-bank/crx-webcast-reloaded/gh-pages/external_website/proxy.html#/watch/' + encodeURIComponent(encodeURIComponent( btoa(video_url) ))  // yes, the base64 value was url-encoded twice intentionally.. you can thank AngularJS (1.x) router

        let constant_bitrates = [{
          name: "1920x1080",
          m3u8: "index_1.m3u8"
        },{
          name: "1280x 720",
          m3u8: "index_2.m3u8"
        },{
          name: " 640x 480",
          m3u8: "index_3.m3u8"
        },{
          name: " 320x 240",
          m3u8: "index_4.m3u8"
        }]
        constant_bitrates.forEach((bitrate) => {
          let url = video_url.replace(/[^\/]+?\.m3u8/i, bitrate.m3u8)
          msg += "\n" + `(${bitrate.name}) ` + 'http://gitcdn.link/cdn/warren-bank/crx-webcast-reloaded/gh-pages/external_website/proxy.html#/watch/' + encodeURIComponent(encodeURIComponent( btoa(url) ))
        })

        let msg_with_instructions = ''
        msg_with_instructions    += 'instructions:' + "\n"
        msg_with_instructions    += '=============' + "\n"
        msg_with_instructions    += 'the following text can be copied from the DevTools console (Ctrl+Shift+I)' + "\n\n"
        msg_with_instructions    += msg

        console.clear()
        console.log(msg)

        alert(msg_with_instructions)
      }
    }
    catch(e){}
  }
}

var inject_payload = function(){
  var inline, script, head

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
