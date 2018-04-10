/* global io */
'use strict'

import App from 'ampersand-app'
import SocketsWrapper from 'lib/sockets'
import ResourceActions from 'actions/resource'
import JobActions from 'actions/job'
import NotificationActions from 'actions/notifications'
import DashboardActions from 'actions/dashboard'
import SessionActions from 'actions/session'
import config from 'config'
const logger = require('lib/logger')('app:sockets')
import OperationsConstants from 'constants/operations'

const connect = (next) => {
  // first time connect is called it is autoconnected
  if (!io.socket) {
    logger.log('connecting sails socket')
    io.sails.connect(next)
  } else {
    if (!io.socket.socket.connected) {
      logger.log('reconnecting socket')
      io.socket.socket.connect()
      next(null,io.socket)
    }
  }
}

const disconnect = () => {
  if (!io.socket) return
  if (io.socket.socket.connected) {
    io.socket.disconnect()
  }
}

const defaultTopics = [
  //'host-stats',
  //'host-processes',
  'monitor-state',
  'job-crud',
  // 'host-integrations-crud', // host integrations changes
  'host-registered'
]

module.exports = () => {
  // initialize io.sails sockets
  io.sails = {
    autoConnect: false,
    useCORSRouteToGetCookie: true,
    environment: config.env,
    url: config.socket_url
  }
  SailsIOClient() // setup sails sockets connection

  let session = App.state.session

  const updateSubscriptions = () => {
    if (!session.customer.id) return

    // unsubscribe
    App.sockets.unsubscribe({
      onUnsubscribed: () => {

        // ... then subscribe again to new customer notifications
        App.sockets.subscribe({
          query: {
            customer: session.customer.name,
            topics: defaultTopics
          }
        })
      }
    })
  }

  App.listenToAndRun(session,'change:logged_in',() => {
    const logged_in = session.logged_in
    if (logged_in===undefined) return
    if (logged_in===true) {
      connect((err,socket) => {
        if (!App.sockets) { // create wrapper to subscribe and start listening to events
          App.sockets = createWrapper({ io })
        }
        App.sockets.subscribe({
          query: {
            customer: session.customer.name,
            topics: defaultTopics
          }
        })
        App.listenTo(session.customer, 'change:id', updateSubscriptions)
      }) // create socket and connect to server
    } else {
      disconnect()
      App.stopListening(session.customer, 'change:id', updateSubscriptions)
    }
  })
}

const createWrapper = ({ io }) => {
  return new SocketsWrapper({
    io,
    events: {
      // socket events handlers
      'notification-crud': event => {
        NotificationActions.add(event.model)
      },
      'session-customer-changed': event => { // temporal fix
        SessionActions.verifyCustomerChange(event.organization)
      },
      'monitor-state': (event) => {
        ResourceActions.update(event.model)
      },
      'job-crud': (event) => {
        if (
          event.operation === OperationsConstants.UPDATE ||
          event.operation === OperationsConstants.CREATE ||
          event.operation === OperationsConstants.REPLACE
        ) {
          JobActions.receiveUpdate(event.model)
        }
      },
      'host-registered': event => {
        DashboardActions.loadNewRegisteredHostAgent(event.model)
      }
    }
  })
}
