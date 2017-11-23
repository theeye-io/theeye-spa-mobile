'use strict'

import App from 'ampersand-app'
import Router from 'ampersand-router'
import AuthActions from 'actions/auth'
import AnalyticsActions from 'actions/analytics'
const logger = require('lib/logger')('router')

// routes
const AuthRoute = require('./auth')
import DashboardRoute from './dashboard'

module.exports = Router.extend({
  execute (callback, args) {
    if (callback) {
      let publicRoute = ['login','register','activate','sociallogin'].find(route => {
        let routeRegex = new RegExp(route)
        return (routeRegex.test(window.location.pathname)||routeRegex.test(window.location.hash))
      })

      let logged_in = App.state.session.logged_in
      if (!publicRoute) {
        // navigate to login if we dont have an access_token
        if (logged_in===undefined) {
          return // wait until it is set
        }
        if (logged_in===false) {
          logger.warn('session expired. must login')
          return false
        } else {
          callback.apply(this, args)
        }
      } else {
        if (logged_in===true) {
          return this.redirectTo('dashboard',{replace: true})
        }
        callback.apply(this, args)
      }
    }
  },
  routes: {
    'dashboard': () => {
      AnalyticsActions.trackView('dashboard')
      const route = new DashboardRoute()
      route.route('index')
    },
    'login': () => {
      AnalyticsActions.trackViewWithNewSession('login')
      const route = new AuthRoute()
      route.route('login')
    },
    'logout': () => {
      AuthActions.logout()
    },
    'register': () => {
      const route = new AuthRoute()
      route.route('register')
    },
    'activate': () => {
      const route = new AuthRoute()
      route.activateRoute()
    },
    'sociallogin': () => {
      const route = new AuthRoute()
      route.socialLoginRoute()
    }
  }
})
