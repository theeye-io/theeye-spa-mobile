module.exports = {
  get () {
    const hashParams = {}
    let e
    const a = /\+/g  // Regex for replacing addition symbol with a space
    const r = /([^&;=]+)=?([^&;]*)/g
    const d = function (s) { return decodeURIComponent(s.replace(a, ' ')) }
    const q = window.location.hash.substring(1)

    while (e = r.exec(q)) { // eslint-disable-line
      hashParams[d(e[1])] = d(e[2])
    }

    return hashParams
  },
  set (name, value) {
    window.location.hash = `${name}=${encodeURIComponent(value)}`
  }
}
