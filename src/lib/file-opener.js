import bootbox from 'bootbox'

module.exports = {
  open (filename) {
    var opener = window.cordova.plugins.disusered.open

    var fileRoute = ''
    switch (window.device.platform) {
      case 'Android':
        fileRoute = '/storage/emulated/0/Download/' + filename
        break
      case 'iOS':
        fileRoute = window.cordova.file.documentsDirectory + 'Download/' + filename
        break
    }

    function success () {}

    function error (code) {
      console.log(code)
      bootbox.alert('Failed to open file located in (' + fileRoute + '). Try opening it manually.')
    }

    function progress (progressEvent) {
    }

    opener(fileRoute, success, error, progress)
  }
}
