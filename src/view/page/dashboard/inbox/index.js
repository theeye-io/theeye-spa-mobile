import App from 'ampersand-app'
import View from 'ampersand-view'
import NotificationActions from 'actions/notifications'
import Modalizer from 'components/modalizer'
import InboxRowFactory from './item/factory'

const DeleteNotificationsView = View.extend({
  template: `
    <div>
      <span>Delete read notifications?</span>
      <div style="bottom:0; position:absolute;">
        <label>
          <input style="margin:0; height:18px; top:5px; position:relative;" type="checkbox">
          <small>
            Also delete unread notifications.
          </small>
        </label>
      </div>
    </div>
  `
})

import './style.less'

const EmptyView = View.extend({
  template: `<div class="no-notifications" data-hook="no-notifications">No notifications</div>`
})

module.exports = View.extend({
  template: `
    <div class="inbox-container">
      <div class="header">
        <span data-hook="inbox-notifications-empty" class="delete-all fa fa-trash-o"></span>
      </div>
      <div>
        <div class="inbox-popup-body" data-hook="inbox-items-container"></div>
      </div>
    </div>`,
  events: {
    'click [data-hook=inbox-notifications-empty]': 'onClickEmptyInbox'
  },
  onClickEmptyInbox (event) {
    const body = new DeleteNotificationsView()
    const modal = new Modalizer({
      confirmButton: 'Delete',
      buttons: true,
      title: 'Notifications',
      bodyView: body
    })

    modal.on('confirm', event => {
      let removeAll = body.query('input').checked
      NotificationActions.removeAllRead(removeAll)
      modal.hide()
    })

    this.listenTo(modal,'hidden',() => {
      modal.remove()
      body.remove()
    })

    modal.show()
  },
  render () {
    this.renderWithTemplate(this)

    this.list = this.renderCollection(
      this.collection,
      InboxRowFactory,
      this.queryByHook('inbox-items-container'),
      {
        emptyView: EmptyView
      }
    )
  }
})
