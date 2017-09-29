'use strict'

//import 'jquery' // imported by webpack. not required
import 'bootstrap'
import config from 'config'

import App from 'ampersand-app'
import AppState from 'state'
import Router from 'router'
import Loader from 'components/loader'
import RootContainer from 'view/root-container'
//import RootContainer from './container'
import query from 'lib/query-params'
const logger = require('lib/logger')('app')

require('app/events')
const sockets = require('app/sockets')

import 'assets/styles'

if (config.env !== 'production') { window.App = App }

// Extends our main app singleton
App.extend({
  EasterEggs: require('components/easter-eggs'),
  Router: new Router(),
  state: new AppState(),
  init () {
    this.bindDocumentEvents()
    this.initState( () => {
      this.registerComponents()
      this.authenticate()
      sockets()
    })
  },
  initState (next) {
    this.state.init()
    next()
  },
  navigate (page) {
    var url = (page.charAt(0) === '/') ? page.slice(1) : page
    if (window.location.pathname.slice(1) === url) return // cancel if page is current
    App.Router.history.navigate(url,{ trigger: true })
  },
  reload (params, append=false) {
    let qs
    if (!append) {
      qs = query.set(params)
    } else {
      qs = query.set( Object.assign({}, query.get(), params) )
    }
    App.Router.navigate(window.location.pathname + `?${qs}`,{replace: true})
    App.Router.reload()
  },
  registerComponents () {
    const state = App.state

    const loader = new Loader()
    state.loader.on('change',() => {
      loader.updateState(state.loader)
    })

    const root = new RootContainer({ el: document.getElementById('root') })
    state.on('change:currentPage',() => {
      root.updateState({ currentPage: state.currentPage })
    })
    root.on('click:localPath',(event) => {
      App.navigate(event.localPath)
    })
  },
  authenticate () {
    // if has access token, should validate it first? it cannot work offline
    App.listenToAndRun(App.state.session,'change:logged_in',() => {
      let logged_in = App.state.session.logged_in
      if (logged_in === undefined) return // wait until it is set

      if (!App.Router.history.started()) {
        App.Router.history.start({ pushState: (document.origin!=='null') })
      }

      let publicRoute = ['login','register','activate','sociallogin'].find(route => {
        let routeRegex = new RegExp(route)
        return routeRegex.test(window.location.pathname)
      })

      if (publicRoute) {
        if (logged_in) {
          App.Router.redirectTo('dashboard',{replace: true})
        }
      } else {
        // not publicRoute
        if (!logged_in) {
          App.Router.redirectTo('login',{replace: true})
        } else {
          if (document.origin=='null') {
            App.Router.redirectTo('dashboard',{replace: true})
          }
        }
      }
      // else {
      //  do nothing
      //}
    })
  },
  bindDocumentEvents () {
    const oninput = (event) => {
      logger.log('document input')
      App.trigger('document:input', event)
    }
    document.addEventListener('input', oninput, false)

    const onclick = (event) => {
      logger.log('document click')
      App.trigger('document:click', event)
    }
    document.addEventListener('click', onclick, false)

    const onkeydown = (event) => {
      logger.log('document keydown')
      App.trigger('document:keydown', event)
    }
    document.addEventListener('keydown', onkeydown, false)
  }
})

App.init()
