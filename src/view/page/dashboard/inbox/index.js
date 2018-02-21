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
  ready: 'queued, waiting for result',
  finished: 'finished running',
  updates_stopped: 'has gone silent',
  updates_started: 'came back to life',
  failure: 'is not working properly',
  canceled: 'has been canceled',
  recovered: 'came back to normal'
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

const iconByType = {
  scraper: 'fa-cloud',
  script: 'fa-code',
  host: 'fa-server',
  process: 'fa-cog',
  file: 'fa-file-o',
  dstat: 'fa-bar-chart',
  psaux: 'fa-cogs'
}

const EmptyView = View.extend({
  template: `<div class="no-notifications" data-hook="no-notifications">No notifications</div>`
})

const InboxRow = View.extend({
  props: {
    severity: 'string',
    modelType: 'string',
    modelName: 'string',
    message: 'string',
    time: 'string',
    icon: 'string',
    text: 'string',
    hostName: 'string'
  },
  template: require('./inboxRow.hbs'),
  bindings: {
    message: { hook: 'message' },
    time: { hook: 'time' },
    modelType: { hook: 'modelType' },
    modelName: { hook: 'modelName' },
    severity: { type: 'class' },
    icon: {
      type: 'attribute',
      name: 'class',
      hook: 'icon'
    },
    hostName: { hook: 'hostName' }
  },
  derived: {
    collapsedHeaderId: {
      deps: ['model.id'],
      fn () {
        return `collapse_heading_${this.model.id}`
      }
    },
    collapseContainerId: {
      deps: ['model.id'],
      fn () {
        return `collapse_container_${this.model.id}`
      }
    },
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

    this.time = moment(this.model.createdAt).format(format)
    this.modelName = this.model.data.model.name
    this.modelType = resourceType[this.model.data.model_type]
    this.icon = ''

    this.severity = stateToSeverity(state)
    this.modelType = ''
    if (type === 'Resource') { // it is resources notification
      let monitor_event = this.model.data.monitor_event
      this.modelType = this.model.data.model.type
      this.message = meaning[monitor_event] || `${monitor_event}:${state}`
      this.icon = icons[monitor_event]
      this.hostName = this.model.data.hostname

      // monitor execution always failure, unless used a recognized state
      if (!this.severity) this.severity = StateConstants.FAILURE

    } else if (/Job/.test(type)===true) { // it is a task execution
      let lifecycle = this.model.data.model.lifecycle
      if(this.model.data.model.task)
        this.modelType = this.model.data.model.task.type
      this.message = meaning[lifecycle] || `${lifecycle}:${state}`
      this.icon = icons[lifecycle]
      this.hostName = this.model.data.model.host.hostname

      // task execution always success, unless declared a failure
      if (!this.severity) this.severity = StateConstants.SUCCESS

    } else {
      console.warning(this.model)
      this.icon = icons[state]
      this.message = `${state}`
    }
  },
  render () {
    this.renderWithTemplate(this)
    this.setModelIcon(this.modelType)
  },
  setModelIcon(type) {
    var iconClass = 'circle fa '
    if(iconByType[type]) {
      iconClass += ` ${iconByType[type]} ${type}-color`
    } else {
      iconClass += 'fa-letter fa-letter-a default-color'
    }
    const iconEl = this.queryByHook('model-icon')
    iconEl.className = iconClass
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
      InboxRow,
      this.queryByHook('inbox-items-container'),
      {
        emptyView: EmptyView
      }
    )
  }
})
