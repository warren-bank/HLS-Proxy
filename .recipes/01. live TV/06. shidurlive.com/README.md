* website hosting live TV video streams: [shidurlive.com](https://shidurlive.com/)
  - site hosts a video player that is embedded on other sites within an iframe
    * [Greasemonkey userscript](https://github.com/warren-bank/crx-miscellaneous/raw/greasemonkey-userscript/greasemonkey-userscript/ShidurLive-embed.user.js) to extract the URL for the HLS manifest of the video stream in an embedded iframe
      - extra permission: need to allow popups on domains that host the embedded iframe
    * examples of such domains:
      - [2ndrun.tv](http://2ndrun.tv/)
