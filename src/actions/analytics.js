module.exports = {
  initPlugin(id) {
    window.ga.startTrackerWithId(id, 30)
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
  trackError(error, log) {
    if(log)
      window.fabric.Crashlytics.addLog(log);
    window.fabric.Crashlytics.sendNonFatalCrash(JSON.stringify(error));
  }
}
