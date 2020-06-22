var fs = require('fs')

if (!fs.existsSync('platforms/android/app/src/main/res/drawable')) {
  fs.mkdirSync('platforms/android/app/src/main/res/drawable')
}

fs.createReadStream('res/drawable/icon_push.png').pipe(
  fs.createWriteStream('platforms/android/app/src/main/res/drawable/icon_push.png')
)
