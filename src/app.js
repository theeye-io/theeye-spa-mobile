import 'bootstrap'
import config from 'config'

import App from 'ampersand-app'
//const models = require('app/models')
// load application models definitions
require('app/models')()

import AppState from 'state'
import Router from 'router'
import Loader from 'components/loader'
import RootContainer from 'view/root-container'
import AnalyticsActions from 'actions/analytics'
import DashboardActions from 'actions/dashboard'

require('app/events')
import sockets from 'app/sockets'
// const sockets = require('app/sockets')
const session = require('app/session')
const actions = require('app/actions')
const pushNotification = require('app/push-notification')

import 'assets/styles'

// Extends our main app singleton
App.extend({
  config: Object.assign({}, config),
  Router: new Router(),
  state: new AppState(),
  init () {
    this.bindDocumentEvents()
    this.initState(() => {
      actions()
      this.registerComponents()
      session()
      sockets()
      pushNotification()
    })
  },
  initState (next) {
    // listen session restored
    this.listenToOnce(this.state.session, 'restored', next)
    this.state.appInit()
  },
  navigate (page) {
    var url = (page.charAt(0) === '/') ? page.slice(1) : page
    // App.Router.history.navigate(url, { trigger: true })
    App.Router.navigate(url)
  },
  registerComponents () {
    const state = App.state

    const loader = new Loader()
    state.loader.on('change', () => {
      loader.updateState(state.loader)
    })

    const root = new RootContainer({ el: document.getElementById('root') })
    state.on('change:currentPage', () => {
      root.updateState({ currentPage: state.currentPage })
    })
    root.on('click:localPath', (event) => {
      if (event.localPath === window.location.pathname) return
      App.navigate(event.localPath)
    })
  },
  bindDocumentEvents () {
    const oninput = (event) => {
      // logger.log('document input')
      App.trigger('document:input', event)
    }
    document.addEventListener('input', oninput, false)

    const onclick = (event) => {
      // logger.log('document click')
      App.trigger('document:click', event)
    }
    document.addEventListener('click', onclick, false)

    const onkeydown = (event) => {
      // logger.log('document keydown')
      App.trigger('document:keydown', event)
    }
    document.addEventListener('keydown', onkeydown, false)
  },
  /**
  * @summary replace current session customer
  */
  customerChange (customer) {
    this.state.session.customer.clear()
    this.state.session.customer.set(customer.serialize())
    this.state.session.customer.fetch()
    this.state.reset()
    this.Router.reload()
  }
})

document.addEventListener('deviceready', function () {
  document.addEventListener('resume', function () {
    DashboardActions.fetchData({ fetchTasks: true, fetchNotifications: true })
    App.sockets.disconnect(() => {
      const session = App.state.session
      App.sockets.connect({ access_token: session.access_token })
    })
  }, false)
  document.addEventListener('backbutton', function (e) {
    e.preventDefault()
  }, false)

  AnalyticsActions.initPlugins()

  App.init()
}, false)

if (!window.cordova) {
  document.dispatchEvent(new window.Event('deviceready'))
}
