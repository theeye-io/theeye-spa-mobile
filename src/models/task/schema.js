import App from 'ampersand-app'
import AppModel from 'lib/app-model'
import AmpersandCollection from 'ampersand-collection'
const DynamicArgument = require('./dynamic-argument').DynamicArgument
const ScheduleCollection = require('models/schedule').Collection
const TagCollection = require('models/tag').Collection

import FIELD from 'constants/field'

const TaskArguments = AmpersandCollection.extend({
  mainIndex: 'id',
  indexes: ['label','order'],
  model: DynamicArgument
})

const Schema = AppModel.extend({
  idAttribute: 'id',
  props: {
    id: 'string',
    user_id: 'string',
    customer_id: 'string',
    workflow_id: 'string',
    public: 'boolean',
    name: 'string',
    description: ['string',false,''],
    acl: 'array',
    secret: 'string',
    grace_time: 'number',
    type: 'string',
    source_model_id: 'string',
    // empty tags and triggers
    tags: ['array',false, () => { return [] }],
    triggers: ['array',false, () => { return [] }],
    timeout: 'number',
    //_id: 'string',
    _type: 'string', // discriminator
    hasSchedules: ['boolean', true, false]
  },
  derived: {
    hasWorkflow: {
      deps: ['workflow_id'],
      fn () {
        return Boolean(this.workflow_id) === true
      }
    }
  },
  session: {
    credentials: ['object', false, null],
    hasDynamicArguments: 'boolean',
    alreadyFetched: ['boolean', false, false],
    inProgressJobs: 'number',
    last_execution: 'date',
    tagsCollection: 'collection'
  },
  collections: {
    //triggers: Events,
    task_arguments: TaskArguments,
    schedules: ScheduleCollection,
    jobs: function (models, options) {
      return new App.Models.Job.Collection(models, options)
    }
  },
  initialize () {
    AppModel.prototype.initialize.apply(this,arguments)

    this.tagsCollection = new TagCollection([])

    this.listenToAndRun(this, 'change:tags', () => {
      if (Array.isArray(this.tags)) {
        let tags = this.tags.map((tag, index) => {
          return {_id: (index + 1).toString(), name: tag}
        })
        tags = tags.slice(0, 3)
        this.tagsCollection.set(tags)
      }
    })

    this.listenToAndRun(this.schedules, 'reset sync remove add', () => {
      this.hasSchedules = this.schedules.length > 0
    })

    this.listenToAndRun(
      this.jobs,
      'add change sync reset remove',
      function () {
        let inProgressJobs = this.jobs.filter(job => job.inProgress)
        if (inProgressJobs.length > 0) {
          this.inProgressJobs = inProgressJobs.length
        } else {
          this.inProgressJobs = 0
        }
      }
    )

    this.listenToAndRun(
      this.jobs,
      'add change sync reset remove',
      function () {
        if (this.jobs.length===0) { return }
        let dates = this.jobs.map(e => e.creation_date)
        this.last_execution = Math.max.apply(null, dates)
      }
    )

    this.listenToAndRun(this.task_arguments, 'add remove change reset sync', () => {
      this.hasDynamicArguments = Boolean(
        this.task_arguments.models.find(arg => {
          return arg.type && (
            arg.type===FIELD.TYPE_INPUT ||
            arg.type===FIELD.TYPE_SELECT ||
            arg.type===FIELD.TYPE_DATE ||
            arg.type===FIELD.TYPE_FILE ||
            arg.type===FIELD.TYPE_REMOTE_OPTIONS
          )
        })
      )
    })
  },
  serialize (options) {
    var serial = AppModel.prototype.serialize.call(this, options)
    if (!this.triggers) {
      serial.triggers = []
    } else {
      serial.triggers = this.triggers
        .filter(eve => {
          if (!eve) return false
          if (typeof eve === 'object') {
            return Boolean(!eve._id)
          }
          return typeof eve === 'string'
        })
        .map(eve => {
          if (typeof eve === 'object') {
            return eve._id
          } else return eve // this is the id string
        })
    }

    delete serial.jobs

    return serial
  },
  hostResource () {
    let col = App.state.resources
    let host = col.models.find(resource => {
      return resource.host_id == this.host_id && resource.type == 'host'
    })
    return host
  },
  hasHost () {
    let host = this.hostResource()
    if (host) {
      return true
    } else {
      return false
    }
  },
  hostIsReporting () {
    let host = this.hostResource()
    if (!host) return true // I cannot determine, so go ahead
    return host.state === 'normal'
  },
  fetchJobs (options, callback) {
    callback || (callback = () => {})

    if (this.alreadyFetched===true && options.forceFetch!==true) {
      return callback() // abort
    }

    let query = {task_id: this.id}

    if (options.hasOwnProperty(query)) {
      query = Object.assign({}, query, options.query)
    }

    this.jobs.fetch({
      data: {
        where: query
      },
      success: () => {
        this.alreadyFetched = true
        callback()
      },
      error: (arg1) => {
        callback( new Error(arg1) )
      }
    })
  }
})

module.exports = Schema
