import App from 'ampersand-app'
import View from 'ampersand-view'
import NotificationActions from 'actions/notifications'
import moment from 'moment'
import Modalizer from 'components/modalizer'
import FormView from 'ampersand-form-view'
import StateConstants from 'constants/states'
import './style.less'

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

const resourceType = {
  Resource: 'Resource',
  ScriptJob: 'Task'
}

const meaning = {
  ready: 'waiting',
  finished: 'finished',
  updates_stopped: 'updates stopped',
  updates_started: 'updates started',
  failure: 'failed',
  canceled: 'canceled',
  recovered: 'recovered'
}

const icons = {
  ready: 'fa fa-clock-o',
  assigned: 'fa fa-clock-o',
  finished: 'fa fa-check-circle',
  completed: 'fa fa-check-circle',
  terminated: 'fa fa-question-circle',
  canceled: 'fa fa-minus-circle',
  normal: 'fa fa-check-circle',
  failure: 'fa fa-exclamation-circle',
  recovered: 'fa fa-check-circle',
  updates_started: 'fa fa-check-circle',
  updates_stopped: 'fa fa-exclamation-circle'
}

const EmptyView = View.extend({
  template: `<div class="no-notifications" data-hook="no-notifications">No notifications</div>`
})

const InboxPopupRow = View.extend({
  props: {
    severity: 'string',
    modelName: 'string',
    message: 'string',
    time: 'string',
    icon: 'string',
    text: 'string'
  },
  template: `
    <div class="inbox-entry panel panel-default">
      <div class="panel-heading">
        <h4 class="panel-title">
          <div class="panel-title-content">
            <div class="panel-item name entry-text">
              <span data-hook="severity"></span>
              <span data-hook="modelName"></span>
              <span data-hook="message"></span>
              <small data-hook="time"></small>
            </div>
            <div class="panel-item state-icon">
              <span data-hook="icon"></span>
            </div>
          </div>
        </h4>
      </div>
    </div>
  `,
  bindings: {
    message: { hook: 'message' },
    time: { hook: 'time' },
    modelName: { hook: 'modelName' },
    severity: { type: 'class' },
    icon: {
      type: 'attribute',
      name: 'class',
      hook: 'icon'
    }
  },
  initialize () {
    this.inboxify()
  },
  inboxify () {
    let format = 'L [at] LT'
    if (new Date().toDateString() === new Date(this.model.createdAt).toDateString()) {
      format = '[Today at] LT'
    }

    const state = sanitizeState(this.model.data.model.state)
    const type = this.model.data.model._type

    this.time = '> ' + moment(this.model.createdAt).format(format)
    this.modelName = this.model.data.model.name
    this.icon = ''

    this.severity = stateToSeverity(state)

    if (type === 'Resource') { // it is resources notification
      let monitor_event = this.model.data.monitor_event
      this.message = meaning[monitor_event] || `${monitor_event}:${state}`
      this.icon = icons[monitor_event]

      // monitor execution always failure, unless used a recognized state
      if (!this.severity) this.severity = StateConstants.FAILURE

    } else if (/Job/.test(type)===true) { // it is a task execution
      let lifecycle = this.model.data.model.lifecycle
      this.message = meaning[lifecycle] || `${lifecycle}:${state}`
      this.icon = icons[lifecycle]

      // task execution always success, unless declared a failure
      if (!this.severity) this.severity = StateConstants.SUCCESS

    } else {
      console.warning(this.model)
      this.icon = icons[state]
      this.message = `${state}`
    }
  }
})

const sanitizeState = (state) => state.toLowerCase().replace(/ /g,"_")

const stateToSeverity = (state) => (StateConstants.STATES.indexOf(state)!==-1) ? state : null

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
    'click [data-hook=inbox-notifications-empty]': "onClickEmptyInbox"
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
      InboxPopupRow,
      this.queryByHook('inbox-items-container'),
      {
        emptyView: EmptyView
      }
    )
  }
})
