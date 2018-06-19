import credentials from 'config/credentials'

module.exports = {
  initPlugins () {
    if (!window.cordova) return
    window.ga.startTrackerWithId(credentials.analytics.tracking_id, 30)
    window.mixpanel.init(credentials.mixpanel.sender_id, function () {
      window.mixpanel.track('App init')
    }, function (err) {
      console.log(err)
    })
  },
  trackView (viewName) {
    if (!window.cordova) return
    window.ga.trackView(viewName)
  },
  trackViewWithNewSession (viewName) {
    if (!window.cordova) return
    window.ga.trackView(viewName, '', true)
  },
  trackEvent (Category, Action, Label) {
    if (!window.cordova) return
    window.ga.trackEvent(Category, Action, Label)
  },
  setMixpanelUser (user) {
    if (!window.cordova) return
    window.mixpanel.people.set({'$name': user.username, '$email': user.email})
    window.mixpanel.identify(user.id)
    window.mixpanel.track('Open app')
  },
  unsetMixpanelUser () {
    if (!window.cordova) return
    window.mixpanel.reset()
  },
  trackMixpanelEvent (eventName, eventData) {
    if (!window.cordova) return
    window.mixpanel.track(eventName, eventData)
  },
  trackMixpanelIncrement (eventName, amount) {
    if (!window.cordova) return
    var increment = {}
    increment[eventName] = amount
    window.mixpanel.people.increment(increment)
  },
  trackError (error, log) {
    if (!window.cordova) return
    if (log) {
      window.fabric.Crashlytics.addLog(log)
    }
    window.fabric.Crashlytics.sendNonFatalCrash(JSON.stringify(error))
  }
}
