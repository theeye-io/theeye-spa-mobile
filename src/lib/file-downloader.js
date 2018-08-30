import mime from 'mime-types'
import bootbox from 'bootbox'

const b64toBlob = function (b64Data, contentType, sliceSize) {
  contentType = contentType || ''
  sliceSize = sliceSize || 512

  // default was atob, changed for window.atob
  var byteCharacters = window.atob(b64Data)
  var byteArrays = []

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize)

    var byteNumbers = new Array(slice.length)
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    var byteArray = new Uint8Array(byteNumbers)

    byteArrays.push(byteArray)
  }

  var blob = new Blob(byteArrays, {type: contentType})
  return blob
}

const saveFile = function (filename, content, contentType) {
  // Convert the base64 string in a Blob
  var DataBlob = b64toBlob(content, contentType)

  var storageLocation = ''
  switch (device.platform) {
    case 'Android':
      storageLocation = 'file:///storage/emulated/0/'
      break
    case 'iOS':
      storageLocation = cordova.file.documentsDirectory
      break
  }

  console.log('Starting to write the file.')
  window.resolveLocalFileSystemURL(storageLocation, function (fileSystem) {
    console.log('Access to the file system directory granted succesfully.')
    fileSystem.getDirectory('Download', {create: true, exclusive: false}, function (downloadsDirectory) {
      console.log('Access to the downloads directory granted succesfully.')
      downloadsDirectory.getFile(filename, {create: true}, function (file) {
        console.log('File created succesfully.')
        file.createWriter(function (fileWriter) {
          fileWriter.onwriteend = function () {
            console.log('File saved succesfully.')
            bootbox.alert('File saved to downloads folder (' + storageLocation + 'Download)')
          }
          console.log('Writing content to file.')
          fileWriter.write(DataBlob)
        }, function () {
          console.log('Unable to save file to path ' + storageLocation + 'Download')
        })
      })
    })
  })
}

module.exports = {
  initDownload (data) {
    var myBaseString = data
    var block = myBaseString.split(';')
    // Get the content type
    var dataContentType = block[0].split(':')[1]
    // Get the base64 content of the file
    var base64Data = block[1].split(',')[1]

    var date = new Date()
    var filename = date.getTime().toString() + '.' + mime.extension(dataContentType)

    saveFile(filename, base64Data, dataContentType)
  }
}
