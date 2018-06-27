import App from 'ampersand-app'
import AppCollection from 'lib/app-collection'
const Schema = require('./schema')

const urlRoot = function () {
  return `${App.config.api_url}/script`
}

const Model = Schema.extend({ urlRoot: urlRoot })

const Collection = AppCollection.extend({
  comparator: 'name',
  model: Model,
  url: urlRoot,
})

exports.Model = Model
exports.Collection = Collection
