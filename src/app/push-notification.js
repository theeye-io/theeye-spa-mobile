import App from 'ampersand-app'
import credentials from 'config/credentials'
import UserActions from 'actions/user'

module.exports = () => {
  App.state.session.on('change:logged_in',() => {
    if(App.state.session.logged_in){
      App.push = PushNotification.init({
        android: {
          senderID: credentials.notifications.gcm.sender_id,
          sound: "true",
          vibrate: "true",
          forceShow: "true"
        },
        browser: {
          pushServiceURL: 'http://push.api.phonegap.com/v1/push'
        },
        ios: {
          alert: "true",
          badge: true,
          sound: 'false'
        },
        windows: {}
      });
      App.push.on('registration', function(data) {
        UserActions.registerDeviceToken(App.state.session.user.id, {
          device_token: data.registrationId,
          uuid: device.uuid,
          platform: device.platform,
          package_name: BuildInfo.packageName
        })
      });
      App.push.on('error', (e) => {
        console.log(e.message);
      });
    }
  })
}
