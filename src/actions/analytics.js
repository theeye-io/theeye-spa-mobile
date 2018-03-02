import credentials from 'config/credentials'

module.exports = {
  initPlugins() {
    window.ga.startTrackerWithId(credentials.analytics.tracking_id, 30)
    mixpanel.init(credentials.mixpanel.sender_id, function() {
      mixpanel.track('App init');
    }, function(err) {
      console.log(err)
    });
  },
  trackView(viewName) {
    window.ga.trackView(viewName)
  },
  trackViewWithNewSession(viewName) {
    window.ga.trackView(viewName, '', true)
  },
  trackEvent(Category, Action, Label) {
    window.ga.trackEvent(Category, Action, Label)
  },
  setMixpanelUser(user) {
    mixpanel.people.set({'$name': user.username, '$email': user.email});
    mixpanel.identify(user.id);
    mixpanel.track('Open app');
  },
  unsetMixpanelUser() {
    mixpanel.reset()
  },
  trackMixpanelEvent(eventName, eventData) {
    mixpanel.track(eventName, eventData);
  },
  trackMixpanelIncrement(eventName, amount){
    var increment = {}
    increment[eventName] = amount
    mixpanel.people.increment(increment)
  },
  trackError(error, log) {
    if(log)
      window.fabric.Crashlytics.addLog(log);
    window.fabric.Crashlytics.sendNonFatalCrash(JSON.stringify(error));
  }
}
