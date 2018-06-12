# TheEye-Mobile

Build instructions:

check enviroment configs in src/config/configs.js

be sure you have the src/config/oauth-config.js file (git ignored)

* `NODE_ENV=<your_environment> ./build.sh`
* `cordova build <platform>`



## iOS Build Instructions

IMPORTANT! Don't create a new build using *cordoba build ios*, because the actual platform/ios version generated has a lot of fixes to 
make the plug-ins work properly. Eg. Push notifications needs some package versions to be setted by hand.

###Build & Test

1. git pull from master branch
2. `npm install`
3. `NODE_ENV=<your_environment> ./build.sh`
4. run `cordova prepare ios`
5. Open xcde and import the ios generated build in *platform/ios
6. in xcode Product -> clean
7. in xcode Product -> Build


** xcode build properties ** 
+ Deployment Target: 9.0
+ Devices: Universal
+ Be sure that Signing (Debug) has *Provisioning Profile: match AdHoc io.theeye.mobile* *Team: Javier Ailbirt* 

**Build versions**
iOS manages n builds attached to the version number. For now we are using same Build and Version #, but, for example, if iOS rejects a version. You will need to change the build number for that version.

**Capabilities**
*All this capabilities options shoul be already setted, because you are using the /platform/ios from the repository. But for references this is how those optins should be setted*

+ Push Notifications - ON
+ Background Modes - ON *(Only "Remote notifications checked")*
+ Keychain sharing - ON *Keychain Groups: io.theeye.mobile*

**Build settings**
Base SDK: *Latest iOS(iOS 11.2*
Valid architectures: *arm64 armv7 armvs7*


**Google Services**
As you are pulling from a builded *platform/ios* this files are already imported to the project, but for references, this files are:
*If any google services change or is added, google files listed down here should be updated*
+ GoogleService-Info.plist
+ google-services.json
+ theEye Mobile entitlements
+ config.xml


#### If you have a device to test
6. Run application in device, login and check that last updates are OK.
7. Run application test should work OK in an emulator device.


**Deployment**


