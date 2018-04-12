import App from 'ampersand-app'

import Event from 'models/event'
import Webhook from 'models/webhook'
import Task from 'models/task'

module.exports = () => {
  App.extend({
    Collections: {
      Tasks: Task.Collection,
      Webhook: Webhook.Collection,
      Events: Event.Collection
    },
    Models: {
      Event: Event.Model,
      Task: {
        Script: Task.Script,
        Scraper: Task.Scraper
      },
      Webhook: Webhook.Model
    }
  })
}
