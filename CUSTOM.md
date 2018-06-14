```bash
sudo gem install cocoapods
pod setup

git clone https://github.com/theeye-io/mobile

cd mobile

npm install
cordova platform add ios
cordova plugin rm phonegap-plugin-push
cordova plugin add phonegap-plugin-push
```

## Setup project

Get `credentials.js` & `oauth-config.js` and place them on `src/config` folder


### Open platform ios with XCode

On the welcome screen of Xcode, use the 'Open another project...' on the bottom right of the splash and navigate to `platforms/ios` and choose _Open_

Get `google-services.json` from the root of the repo directory & `GoogleService-info.plist` and import them on the Xcode project

Go to Preferences, Accounts. Add account: jailbirt@theeye.io

### Import certificates:

Install _fastlane_ from the console:

```bash
brew cask install fastlane

# or sudo gem install fastlane -NV

cd platforms/ios # <-- IMPORTANT!

fastlane init
```

Once initialized you'll get a `fastlane` directory. Get `Fastfile` and `Matchfile` files and copy them inside the `fastlane` directory. Usually this will be `platforms/ios/fastlane`.

**NOTE** Next step will need the **passphrase**

From `platforms/ios` run the these commands:
```bash
fastlane match adhoc --readonly
fastlane match appstore --readonly
```

If any of those commands raise a warning: (delete expired certs)[https://stackoverflow.com/questions/35390072/this-certificate-has-an-invalid-issuer-apple-push-services] on Keychain and try again. Keep trying till you succeed.


### Xcode
On the _General_ tab, locate the _Provisioning Profile_ dropdown and select `AdHoc` and `AppStore` on _Signing (Debug)_ and _Signing (Release)_ sections respectively.

Go to _Info_ tab, to the _URL Types_, add:
```
identifier: io.theeye.mobile
URL schemes: io.theeye.mobile
```

### Last but not least
Go to the console, from the `platforms/ios` and run:
```bash
pod install
```

### Build
It is usually a good idea to run the project having built for production:
```bash
NODE_ENV=production ./build.sh
cordova prepare ios
```

Then, from **Xcode**, use _Product -> Clean_ & _Product -> Build_ menus before running it (with the _play_ button)

That's it. Go get'em tiger!
