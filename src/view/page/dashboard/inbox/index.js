import App from 'ampersand-app'
import View from 'ampersand-view'
import NotificationActions from 'actions/notifications'
import moment from 'moment'
import Modalizer from 'components/modalizer'
import FormView from 'ampersand-form-view'
import StateConstants from 'constants/states'
import LifecycleConstants from 'constants/lifecycle'
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
  'lifecycle:ready': 'Queued',
  'lifecycle:assigned': 'Task is being executed',
  'lifecycle:finished': 'Finished running',
  'lifecycle:canceled': 'Has been canceled',
  'lifecycle:terminated': 'Terminated abnormally',
  'lifecycle:completed': 'Completed',
  updates_stopped: 'Has gone silent',
  updates_started: 'Came back to life',
  failure: 'Requires your attention',
  recovered: 'Came back to normal',
  'file:restored': 'File restored',
  'host:stats:normal': 'Host stats back to normal',
  'host:stats:cpu:high': 'Host CPU high',
  'host:stats:mem:high': 'Host memory high',
  'host:stats:disk:high': 'Host disk high',
  'host:stats:cache:high': 'Host cache high'
}

const eventIcons = {
  'lifecycle:ready': 'fa fa-clock-o',
  'lifecycle:assigned': 'fa fa-clock-o',
  'lifecycle:finished': 'fa fa-check-circle',
  'lifecycle:canceled': 'fa fa-minus-circle',
  'lifecycle:terminated': 'fa fa-question-circle',
  'lifecycle:completed': 'fa fa-check-circle',
  success: 'fa fa-check-circle',
  normal: 'fa fa-check-circle',
  failure: 'fa fa-exclamation-circle',
  recovered: 'fa fa-check-circle',
  updates_started: 'fa fa-check-circle',
  updates_stopped: 'fa fa-times-circle',
  'file:restored': 'fa fa-refresh',
  'host:stats:normal': 'fa fa-check-circle',
  'host:stats:cpu:high': 'fa fa-bar-chart',
  'host:stats:mem:high': 'fa fa-bar-chart',
  'host:stats:disk:high': 'fa fa-bar-chart',
  'host:stats:cache:high': 'fa fa-bar-chart'
}

const iconByType = {
  scraper: 'fa-cloud',
  script: 'fa-code',
  host: 'fa-server',
  process: 'fa-cog',
  file: 'fa-file-o',
  dstat: 'fa-bar-chart',
  psaux: 'fa-cogs',
  nested: 'fa-bullseye'
}

const EmptyView = View.extend({
  template: `<div class="no-notifications" data-hook="no-notifications">No notifications</div>`
})

const InboxRow = View.extend({
  props: {
    colorClass: 'string',
    modelType: 'string',
    modelSubType: 'string',
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
    modelSubType: { hook: 'modelSubType' },
    modelName: { hook: 'modelName' },
    colorClass: { type: 'class' },
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

    const type = this.model.data.model._type

    this.time = moment(this.model.createdAt).format(format)
    this.modelName = this.model.data.model.name
    this.modelType = resourceType[this.model.data.model_type]
    this.modelSubType = ''
    this.icon = ''

    if (type === 'Resource') {
      this.resourceInboxItem()
    } else if (/Job/.test(type)===true) {
      this.jobInboxItem()
    } else {
      this.defaultInboxItem()
    }
  },
  resourceInboxItem () {
    let state = sanitizeState(this.model.data.model.state)
    let monitor_event = this.model.data.monitor_event
    let custom_event = this.model.data.custom_event
    let hostname = this.model.data.hostname

    let eventIndex = custom_event || monitor_event

    this.hostName = hostname
    this.modelSubType = this.model.data.model.type
    this.message = meaning[eventIndex] || meaning[monitor_event]
    this.icon = eventIcons[eventIndex] || eventIcons[monitor_event]

    // monitor execution always failure, unless used a recognized state
    if (state!=='normal') {
      this.colorClass = severityToColorClass(this.model.data.model.failure_severity)
      if (!this.colorClass) {
        this.colorClass = StateConstants.FAILURE
      }
    } else {
      this.colorClass = StateConstants.SUCCESS
    }
  },
  jobInboxItem () {
    // it is a task execution
    let state = sanitizeState(this.model.data.model.state)
    let lifecycle = this.model.data.model.lifecycle
    let hostname = this.model.data.model.host.hostname

    this.hostName = hostname

    if(this.model.data.model.task)
      this.modelSubType = this.model.data.model.task.type
    this.message = meaning['lifecycle:' + lifecycle] || `${lifecycle}:${state}`

    if (this.modelName === 'agent:config:update') {
      this.modelName = `${hostname} configuration update`
    }

    if (lifecycle === LifecycleConstants.FINISHED) {
      if (state === StateConstants.FAILURE) {
        this.icon = eventIcons[state]
      } else {
        this.icon = eventIcons[StateConstants.SUCCESS]
      }
    } else {
      this.icon = eventIcons['lifecycle:' + lifecycle]
    }

    // task execution always success, unless declared a failure
    this.colorClass = stateToColorClass(state)
    if (!this.colorClass) {
      this.colorClass = StateConstants.SUCCESS
    }
  },
  defaultInboxItem () {
    let state = sanitizeState(this.model.data.model.state)
    //console.warning(this.model)
    this.icon = eventIcons[state]
    this.message = `${state}`
  },
  render () {
    this.renderWithTemplate(this)
    this.setModelIcon(this.modelSubType)
  },
  setModelIcon(modelSubType) {
    var iconClass = 'circle fa '
    if(modelSubType) {
      iconClass += ` ${iconByType[modelSubType]} ${modelSubType}-color`
    } else {
      iconClass += ` ${iconByType['host']} host-color`
    }

    const iconEl = this.queryByHook('model-icon')
    iconEl.className = iconClass
  }
})

const sanitizeState = (state) => state.toLowerCase().replace(/ /g,"_")

const stateToColorClass = (state) => (StateConstants.STATES.indexOf(state)!==-1) ? state : null

const severityToColorClass = sev => `severity-${sev.toLowerCase()}`

const isDescendant = (parent, child) => {
  let node = child.parentNode
  while (node != null) {
    if (node === parent) {
      return true
    }
    node = node.parentNode
  }
  return false
}

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
