import BaseItem from './base'
import eventIcons from './event-icons'
import StateConstants from 'constants/states'

module.exports = BaseItem.extend({
  template: require('./inboxNotificationRow.hbs'),
  customizeItem () {
    this.message = this.model.data.model.task.subject
    this.colorClass = StateConstants.SUCCESS
    this.icon = eventIcons[this.model.data.model._type]
    this.modelName = this.model.data.model.task.name
  }
})
