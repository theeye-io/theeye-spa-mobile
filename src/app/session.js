import App from 'ampersand-app'
import SessionActions from 'actions/session'
import config from 'config'

module.exports = () => {
  let refreshInterval

  const publics = [
    'login',
    'register',
    'activate',
    'sociallogin',
    'passwordreset',
    'enterprise'
  ]

  const refreshIntervalMs = config.session.refresh_interval

  const isPublicRoute = (pathname) => {
    return publics.some(route => {
      let routeRegex = new RegExp(route)
      return routeRegex.test(pathname)
    })
  }

  const isLoggingOut = (pathname) => /logout/.test(pathname) === true

  App.listenToAndRun(App.state.session, 'change:logged_in', () => {
    let loggedIn = App.state.session.logged_in
    if (loggedIn === undefined) { return } // wait until it is set

    if (!App.Router.history.started()) {
      App.Router.history.start({
        pushState: (window.origin !== 'null')
      })
    }

    let publicRoute = isPublicRoute(window.location.pathname)
    if (!publicRoute) {
      if (loggedIn===false) {
        App.Router.redirectTo('login', {replace: true})
      } else {
        if (window.origin === 'null') {
          // redirect to dashboard only if pushState is not supported
          App.Router.redirectTo('dashboard', { replace: true })
        }
      }
    } else { // is public route
      if (loggedIn === true) {
        App.Router.redirectTo('dashboard', { replace: true })
      }
    }
  })

  App.listenToAndRun(App.state.session, 'change:logged_in', () => {
    if (App.state.session.logged_in === true) {
      // refresh token
      SessionActions.refreshAccessToken()
      // set next refresh interval
      refreshInterval = setInterval(() => {
        SessionActions.refreshAccessToken()
      }, refreshIntervalMs)
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  })

  // refresh access token on each router navigate
  App.Router.on('route', () => {
    if (App.state.session.logged_in === true) {
      let path = window.location.pathname
      if (!isPublicRoute(path) && !isLoggingOut(path)) {
        SessionActions.refreshAccessToken()
      }
    }
  })
}
