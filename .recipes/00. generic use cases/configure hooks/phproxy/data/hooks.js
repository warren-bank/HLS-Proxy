/*
 * anonymous web proxy:
 *   https://2ip.io/anonim/
 * one of the available US servers:
 *   http://fgks.org/proxy/
 * software:
 *   https://github.com/emersion/phproxy
 *   PHProxy 0.5b2
 */

module.exports = {
  "redirect_final": (url) => `http://fgks.org/proxy/index.php?hl=e1&q=${encodeURIComponent(url)}`
}
