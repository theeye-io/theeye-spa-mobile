import BaseItem from './base'
import EventIcons from './event-icons'
import StateConstants from 'constants/states'
import messageFactory from 'models/notification/messageFactory'

module.exports = BaseItem.extend({
  template: require('./inboxNotificationRow.hbs'),
  customizeItem () {
    // this.colorClass = StateConstants.SUCCESS
    // this.icon = eventIcons[this.model.data.model._type]
    // this.message = this.model.data.model.task.subject
    // this.modelName = this.model.data.model.task.name

    let notification = this.model
    this.colorClass = notification.data.model._type
    this.icon = EventIcons[notification.data.model._type]
    this.message = messageFactory(notification)
    this.modelName = notification.data.model.name
  }
})
