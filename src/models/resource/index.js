import App from 'ampersand-app'
import State from 'ampersand-state'
import AppCollection from 'lib/app-collection'
import moment from 'moment'
import assign from 'lodash/assign'
import MonitorConstants from 'constants/monitor'

const MonitorSchema = require('./monitor-schema')
const ResourceSchema = require('./resource-schema')
const TagCollection = require('models/tag').Collection
//const MonitorTemplate = require('./monitor-template')
//const ResourceTemplate = require('./resource-template')
const Host = require('models/host/index').Model

import stateIcon from 'models/state-icon'
import stateOrder from 'models/state-order'
import stateMeaning from 'models/state-meaning'

const urlRoot = function () {
  return `${App.config.api_url}/resource`
}

const stateMessages = {
  normal: 'Working fine',
  failure: 'Attention required',
  updates_stopped: 'Stopped reporting',
}

/**
 *
 * monitor resource submodel
 *
 */
const MonitorBaseModel = MonitorSchema.extend({
  props: {
    resource_id: 'string',
    enable: 'boolean',
    creation_date: 'date',
    last_update: 'date'
  },
  children: {
    template: MonitorSchema
  }
})

const Monitor = MonitorBaseModel.extend({
  props: {
    host_id: 'string',
    template_id: 'string',
    config: ['object',false, () => { return {} }],
  },
  children: {
    host: Host
  },
})

const _Collection = AppCollection.extend({
  model: ResourceFactory,
  isModel (model) {
    return model instanceof Resource || model instanceof NestedResource
  }
})

const ResourceCollection = _Collection.extend({
  url: urlRoot,
  // javascript array comparator
  comparator (m1,m2) {
    // sort by state order
    if (m1.stateOrder>m2.stateOrder) {
      return -1
    } else if (m1.stateOrder<m2.stateOrder) {
      return 1
    } else {
      // if equal state order, sort by name
      let name1 = m1.name ? m1.name.toLowerCase() : 0
      let name2 = m2.name ? m2.name.toLowerCase() : 0
      if (name1>name2) return -1
      else if (name1<name2) return 1
      else return 0
    }
  },
  higherSeverityMonitor () {
    const submonitors = this.models
    if (!submonitors||submonitors.length===0) return null
    return submonitors.reduce( (worstMonitor,monitor) => {
      if (!worstMonitor) return monitor;
      var m1 = monitor.stateOrder
      var m2 = worstMonitor.stateOrder
      return (m1>m2) ? monitor : worstMonitor;
    }, null )
  }
})

const NestedMonitorConfig = State.extend({
  collections: {
    monitors: function () {
      const Col = ResourceCollection
      return new (Col.bind.apply(Col, arguments))([])
    }
  },
  serialize () {
    return { monitors: this.monitors.map(m => m.id) }
  }
})

const NestedMonitor = MonitorBaseModel.extend({
  props: {
    looptime: ['number', false, 0], // is not required
  },
  children: {
    config: NestedMonitorConfig
  },
  initialize () {
    MonitorBaseModel.prototype.initialize.apply(this, arguments)
    this.type = MonitorConstants.TYPE_NESTED
  },
  serialize () {
    const serialize = MonitorSchema.prototype.serialize
    let data = Object.assign({}, serialize.apply(this))
    data.monitors = data.config.monitors
    delete data.config
    return data
  }
})

const ResourceBaseModel = ResourceSchema.extend({
  urlRoot: urlRoot,
  props: {
    monitor_id: 'string',
    hostname: 'string',
    fails_count: 'number',
    state: 'string',
    enable: 'boolean',
    creation_date: 'date',
    last_update: 'date',
    last_event: 'object',
    last_check: 'date'
  },
  derived: {
    last_update_formatted: {
      deps: ['last_update'],
      fn () {
        return moment(this.last_update)
          .startOf('second')
          .fromNow()
      }
    },
    /**
     * Based on resource state and its failure severity returns its severity state
     * If the resource is failing, resturns the failure severity instead.
     * @return String
     */
    stateSeverity: {
      deps: ['state','failure_severity'],
      fn () {
        const state = this.state || 'error'
        const severity = this.failure_severity || 'HIGH'

        if (state==='failure') {
          return severity.toLowerCase();
        } else {
          return state.toLowerCase();
        }
      }
    },
    formatted_tags: {
      deps: ['name','hostname','type','state','failure_severity','tags','acl'],
      fn () {
        return [
          this.name,
          this.state,
          this.hostname,
          this.type,
          this.failure_severity
        ].concat(this.acl, this.tags)
      }
    },
    stateIcon: {
      deps: ['stateSeverity'],
      fn () {
        return stateIcon[ this.stateSeverity ]
      }
    },
    stateOrder: {
      deps: ['stateSeverity'],
      fn () {
        return stateOrder.orderOf( this.stateSeverity )
      }
    }
  },
  hasError () {
    return this.state === 'failure' || this.state === 'updates_stopped'
  },
  parse (attrs) {
    const monitor = (attrs.monitor || attrs.template_monitor)
    if (!monitor) { return attrs }

    return assign({}, attrs, {
      // monitor
      looptime: monitor.looptime,
      tags: monitor.tags
    })
  },
  serialize () {
    const serialize = ResourceSchema.prototype.serialize
    const monitor = this.monitor.serialize()
    let data = assign({}, serialize.apply(this), monitor)

    data.id = this.id

    delete data.customer
    delete data.user
    delete data.host

    return data
  }
})

const Resource = ResourceBaseModel.extend({
  props: {
    template_id: 'string',
    host_id: 'string',
  },
  children: {
    monitor: Monitor, // has one
    template: ResourceSchema, // belongs to
    host: Host, // belongs to
  },
  session: {
    tagsCollection: 'collection'
  },
  initialize (options) {
    //this.id = options._id || options.id
    ResourceBaseModel.prototype.initialize.apply(this,arguments)

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
  }
})

const NestedResource = ResourceBaseModel.extend({
  urlRoot: function () {
    return `${App.config.api_v3_url}/resource/nested`
  },
  children: {
    monitor: NestedMonitor, // has one
  },
  initialize () {
    ResourceBaseModel.prototype.initialize.apply(this, arguments)
    this.type = MonitorConstants.TYPE_NESTED
  }
})

function MonitorFactory (data) {
  if (data.type == MonitorConstants.TYPE_NESTED) {
    return new NestedMonitor(data)
  } else {
    return new Monitor(data)
  }
}

function ResourceFactory (data, options={}) {
  let resource
  let monitor = MonitorFactory(data.monitor || data)

  if (data.type == MonitorConstants.TYPE_NESTED) {
    resource = new NestedResource(data, options)
  } else {
    resource = new Resource(data, options)
  }
  resource.monitor = monitor

  return resource
}

/**
 * Resource but with a subresources/submonitors collection
 */
const GroupedResource = Resource.extend({
  hasError () {
    if (!this.submonitors || this.submonitors.length===0) {
      return false
    }

    return this.submonitors
      .filter(m => m.hasError())
      .length > 0
  },
  collections: {
    submonitors: ResourceCollection
  },
  initialize () {
    Resource.prototype.initialize.apply(this,arguments)

    this.listenTo(this.submonitors,'change add reset',() => {
      if (this.submonitors.length===0) return
      const monitor = this.submonitors.higherSeverityMonitor()

      this.state = monitor.state
      this.failure_severity = monitor.failure_severity
    })
  }
})

const GroupedResourceCollection = ResourceCollection.extend({
  // is not being used. this collection works like a subset of the resources collection
  //model (attrs, options) {
  //},
  isModel (model) {
    const isModel = ResourceCollection.prototype.isModel

    return isModel.call(this, model) || model instanceof GroupedResource
  },
  find (resource) {
    const _find = ResourceCollection.prototype.find
    // find the resource within a group or theresource alone
    return _find.call(this, group => {
      if (group.id === resource.id) return true
      if (!group.submonitors||group.submonitors.length===0) return false

      const item = group.submonitors.find(m => {
        if (m.id === resource.id) return true
        else if (m.type === 'host') {
          if (!m.submonitors||m.submonitors.length===0) return false
          return m.submonitors.get(resource.id)
        }
      })
      return item !== undefined
    })
  }
})

exports.Model = Resource
exports.Monitor = Monitor
exports.Nested = NestedResource
exports.GroupedResource = GroupedResource
exports.Factory = ResourceFactory

//exports.Template = ResourceTemplate
exports.Collection = ResourceCollection
exports.GroupedResourceCollection = GroupedResourceCollection
