var fs = require('fs')

if (!fs.existsSync('platforms/android/res')) {
  fs.mkdirSync('platforms/android/res')
}

if (!fs.existsSync('platforms/android/res/drawable')) {
  fs.mkdirSync('platforms/android/res/drawable')
}

fs.createReadStream('res/drawable/icon_push.png').pipe(
  fs.createWriteStream('platforms/android/res/drawable/icon_push.png')
)
