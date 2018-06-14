# Read carefully and stick to the instructions below
![I choose my words carefully and I don't repeat myself](https://i.pinimg.com/originals/1d/93/f2/1d93f28f2f32bb516b1544ea2b0d1f5d.jpg)

## Install & Dependencies

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


### Open platform ios with Xcode

On the welcome screen of **Xcode**, use the _Open another project..._ on the bottom right of the splash, navigate to `platforms/ios` directory of the cloned repo and choose _Open_

Get `google-services.json` from the root of the repo directory & `GoogleService-info.plist` and import them on the **Xcode** project

Go to _Preferences -> Accounts_, add account: jailbirt@theeye.io (you'll need the password)

### Import certificates:

Install _fastlane_ from the console:

```bash
brew cask install fastlane

# or sudo gem install fastlane -NV

cd platforms/ios # <-- IMPORTANT!

fastlane init
```

Once initialized you'll get a `fastlane` directory. Get `Fastfile` and `Matchfile` files and copy them inside the `fastlane` directory. Usually this will be `platforms/ios/fastlane`.

**NOTE** Next step will need the credentials **passphrase**

From `platforms/ios` run the these commands:
```bash
fastlane match adhoc --readonly
fastlane match appstore --readonly
```

If any of those commands raise a warning, try (deleting expired certs)[https://stackoverflow.com/questions/35390072/this-certificate-has-an-invalid-issuer-apple-push-services] on Keychain and run again. Keep trying till you succeed.


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
