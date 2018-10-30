import App from 'ampersand-app'
import AppModel from 'lib/app-model'
import AppCollection from 'lib/app-collection'

const Model = AppModel.extend({
  urlRoot () {
    let _id = App.state.session.customer.id
    return `${App.config.api_v3_url}/customer/${_id}/token`
  },
  props: {
    token: 'string',
    username: 'string'
  }
})

const Collection = AppCollection.extend({
  url () {
    let _id = App.state.session.customer.id
    return `${App.config.api_v3_url}/customer/${_id}/token`
  },
  model: Model
})

exports.Model = Model
exports.Collection = Collection
