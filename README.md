# TheEye-Mobile

Build instructions:

check enviroment configs in src/config/configs.js

be sure you have the src/config/oauth-config.js file (git ignored)

* `NODE_ENV=<your_environment> ./build.sh`
* `cordova build <platform>`



## iOS Build Instructions

**IMPORTANT!** Don't create a new build using `cordoba build ios`, because the actual platform/ios version generated has a lot of fixes to 
make the plug-ins work properly. Eg. Push notifications needs some package versions to be set by hand.


### Provisioning files & Certificates
To manage signing certificates and provisioning files, we use fastlane (https://github.com/fastlane/fastlane) and match (https://docs.fastlane.tools/actions/match/) tools. With this tools we can centralize all cerificates and provisioning files in a common repository, and then automate the deploy process to the AppStore.

In *platform/ios* you will find the directory */fastlane*. Inside you will find all the files provided by the tool to execute the provisioning & certificates sync and the deployment process.
Inside */fastlane* you will find 2 importante files:
+ Fastfile
+ Matchfile

#### Matchfile
In file Matchfile you will find the information to sync credentials and provisioning files to your environment.


#### Fastfile
In file Fastfile you will find the directives to execute the deployment for each environment and wich resources should use that deployment.
Eg. beta, the process will run an *ad-hoc* deployment, using  *match AdHoc io.theeye.mobile* provinsioning files.


##### For local environment deployment & testing
1. Go to */platform/ios*
2. run `fastlane match adhoc --readonly` (--readonly is important because you dont want to regenerate certificates)
At this point you should see the adHoc certificate in xcode 

##### For production environment deployment
1. Go to */platform/ios*
2. run `fastlane match appstore --readonly`


### Build & Test

1. git pull from master branch
2. `npm install`
3. `NODE_ENV=<your_environment> ./build.sh`
4. run `cordova prepare ios`
5. Open xcde and import the ios generated build in *platform/ios*
6. in xcode Product -> clean
7. in xcode Product -> Build


**xcode build properties** 
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


### Deployment

#### Local deployment & Testing
This is covered in above section *Build & Test*, after downloading the adHoc provisioning files, run directly from xcode

#### Beta deployment
To deploy app in Crashlytics / Fabric.io,

1. Be sure that you have succesfully completed adhoc steps from *Provisioning files & Certificates*
2. go to */platform/ios* and run `fastlane beta`
3. Wait for the magic to finish
4. Go to Fabric.io and check new version uploaded correctly


#### Production deployment
To deploy app in App Store

1. Be sure that you have succesfully completed appstore steps from *Provisioning files & Certificates*
2. go to */platform/ios* and run `fastlane release`
3. Wait for the magic to finish
5. Go to [itunes connect](https://itunesconnect.apple.com/) and finish the release processo to the App Store 









