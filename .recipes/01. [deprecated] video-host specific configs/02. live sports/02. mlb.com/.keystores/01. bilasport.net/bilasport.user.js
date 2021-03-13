// ==UserScript==
// @name BilaSport MLB Keystore
// @description Extract information about MLB stream
// @version 0.3.0
// @match *://bilasport.net/mlb/*
// @icon http://bilasport.net/img/e2f33d2d006318df9fb1636fd2851df6.png
// ==/UserScript==

// https://www.chromium.org/developers/design-documents/user-scripts

var payload = function(){
  if (top.location != self.location){
    top.location = self.location.href
  }
  else {
    try {
      if (window.data.source && (window.data.source.toLowerCase().indexOf('.m3u8') >= 0)) {
        let video_url = window.data.source

        let msg = ''
        msg += 'video stream:' + "\n"
        msg += '=============' + "\n"
        msg += video_url       + "\n\n"

        msg += 'video stream (HLS-Proxy):' + "\n"
        msg += '=========================' + "\n"
        msg += '( adaptive )        '
        msg += 'http://gitcdn.link/cdn/warren-bank/crx-webcast-reloaded/gh-pages/external_website/proxy.html#/watch/' + encodeURIComponent(encodeURIComponent( btoa(video_url) ))  // yes, the base64 value was url-encoded twice intentionally.. you can thank AngularJS (1.x) router

        let constant_bitrates = [{
          name: " 320x180 @ 30 fps",
          m3u8: "192K/192_complete.m3u8"
        },{
          name: " 384x216 @ 30 fps",
          m3u8: "514K/514_complete.m3u8"
        },{
          name: " 512x288 @ 30 fps",
          m3u8: "800K/800_complete.m3u8"
        },{
          name: " 640x360 @ 30 fps",
          m3u8: "1200K/1200_complete.m3u8"
        },{
          name: " 896x504 @ 30 fps",
          m3u8: "1800K/1800_complete.m3u8"
        },{
          name: " 960x540 @ 30 fps",
          m3u8: "2500K/2500_complete.m3u8"
        },{
          name: "1280x720 @ 30 fps",
          m3u8: "3500K/3500_complete.m3u8"
        },{
          name: "1280x720 @ 60 fps",
          m3u8: "5600K/5600_complete.m3u8"
        }]
        constant_bitrates.forEach((bitrate) => {
          let url = video_url.replace(/[^\/]+?\.m3u8/i, bitrate.m3u8)
          msg += "\n" + `(${bitrate.name}) ` + 'http://gitcdn.link/cdn/warren-bank/crx-webcast-reloaded/gh-pages/external_website/proxy.html#/watch/' + encodeURIComponent(encodeURIComponent( btoa(url) ))
        })

        let keystore
        try {
          keystore = XMLHttpRequest.prototype.open.toString()

          let pattern = /^.*?rewrittenU(rl\.replace\([^\)]+\)).*$/im
          if (pattern.test(keystore)) {
            keystore = keystore.replace(/[\r\n\t]/g, ' ').replace(pattern, 'u$1')
          }
        }
        catch(e) {
          keystore = ''
        }

        if (keystore) {
          msg += "\n\n"
          msg += 'keystore:' + "\n"
          msg += '=========' + "\n"
          msg += keystore
        }

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
