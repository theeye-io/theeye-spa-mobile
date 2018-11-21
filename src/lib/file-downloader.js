import mime from 'mime-types'
import bootbox from 'bootbox'
import fileOpener from 'lib/file-opener'
import isURL from 'validator/lib/isURL'

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

const getDownloadsDirectory = function (next) {
  var storageLocation = ''
  switch (window.device.platform) {
    case 'Android':
      storageLocation = 'file:///storage/emulated/0/'
      break
    case 'iOS':
      storageLocation = window.cordova.file.documentsDirectory
      break
  }

  window.resolveLocalFileSystemURL(storageLocation, function (fileSystem) {
    fileSystem.getDirectory('Download', {create: true, exclusive: false}, function (downloadsDirectory) {
      next(downloadsDirectory)
    })
  })
}

const saveFile = function (filename, content, contentType) {
  // Convert the base64 string in a Blob
  var DataBlob = b64toBlob(content, contentType)

  getDownloadsDirectory(function (downloadsDirectory) {
    downloadsDirectory.getFile(filename, {create: true}, function (file) {
      file.createWriter(function (fileWriter) {
        fileWriter.onwriteend = function () {
          fileOpener.open(filename, true)
        }
        fileWriter.write(DataBlob)
      }, function () {
        bootbox.alert('Error downloading file.')
      })
    })
  })
}

module.exports = {
  base64Download (data) {
    var myBaseString = data
    var block = myBaseString.split(';')
    // Get the content type
    var dataContentType = block[0].split(':')[1]
    // Get the base64 content of the file
    var base64Data = block[1].split(',')[1]

    var date = new Date()
    var filename = date.getTime().toString() + '.' + mime.extension(dataContentType)

    saveFile(filename, base64Data, dataContentType)
  },
  urlDownload (url) {
    if (isURL(url)) {
      getDownloadsDirectory(function (downloadsDirectory) {
        let fileTransfer = new FileTransfer()
        let filename = url.substring(url.lastIndexOf('/') + 1)
        let fileUrl = downloadsDirectory.nativeURL + filename

        fileTransfer.download(
          url,
          fileUrl, function (entry) {
            console.log('download complete: ' + entry.toURL())
            fileOpener.open(filename, true)
          },
         function (error) {
           console.log('download error source ' + error.source)
           console.log('download error target ' + error.target)
           console.log('download error code' + error.code)
         },
         false,
         {}
       )
      })
    } else {
      bootbox.alert('Error downloading file, invalid file URL.')
    }
  }
}
