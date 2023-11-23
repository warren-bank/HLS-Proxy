const Cryptr = require('./lib/cryptr')
const cryptr = new Cryptr('my secret symmetric AES encryption key')

const encrypted_url_prefix = 'http://encrypted.example.com/'

const encrypt_url = (cleartext_url) => {
  const encrypted_url = (cleartext_url)
    ? encrypted_url_prefix + cryptr.encrypt(cleartext_url)
    : ''

  return encrypted_url
}

const decrypt_url = (encrypted_url) => {
  let cleartext_url = encrypted_url

  if (encrypted_url && encrypted_url.startsWith(encrypted_url_prefix)) {
    encrypted_url = encrypted_url.substring(encrypted_url_prefix.length, encrypted_url.length)

    cleartext_url = cryptr.decrypt(encrypted_url)
  }

  return cleartext_url
}

module.exports = {
  "redirect": (cleartext_url) => encrypt_url(cleartext_url),
  "rewrite":  (encrypted_url) => decrypt_url(encrypted_url)
}
