import View from 'ampersand-view'
import acls from 'lib/acls'
import lang2ext from 'lib/lang2ext'
import moment from 'moment'
import assign from 'lodash/assign'

import State from 'ampersand-state'
import Collection from 'ampersand-collection'

const GenericCollapsedContent = View.extend({
  template: `<div>no definition</div>`,
  props: {
    monitor: 'state',
    resource: 'state'
  },
  bindings: {
    'monitor.host.hostname': { hook: 'hostname' },
    interval: { hook: 'interval' },
    description: { hook: 'description' },
    'monitor.name': { hook: 'name' },
  },
  derived: {
    interval: {
      deps: ['monitor.looptime'],
      fn () {
        const dur = moment.duration(this.monitor.looptime)
        const secs = dur.seconds()
        const mins = dur.minutes()

        if (!mins && !secs) return 'error'

        if (!mins) return `${secs} secs`
        if (!secs) return `${mins} mins`
        return `${mins} mins ${secs} secs`
      }
    },
    description: {
      deps: ['monitor.description'],
      fn () {
        return this.monitor.description || 'no details'
      }
    }
  }
})

const bindings = GenericCollapsedContent.prototype.bindings

const ScraperCollapsedContent = GenericCollapsedContent.extend({
  template: `
    <div class="task-container">
      <p><i data-hook="name"></i></p>
      <p>This monitor is executed on <i data-hook="hostname"></i> every <i data-hook="interval"></i></p>
      <i data-hook="description"></i>
      <h4>Request details</h4>
      <table class="table table-stripped">
        <thead>
          <tr data-hook="title-cols">
            <th></th>
            <th>URL</th>
            <th>Method</th>
            <th>Timeout</th>
            <th>Status Code</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            <td><span data-hook="url"></span></td>
            <td><span data-hook="method"></span></td>
            <td><span data-hook="timeout"></span></td>
            <td><span data-hook="status_code"></span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  bindings: assign({}, bindings, {
    url: { hook: 'url' },
    method: { hook: 'method' },
    status_code: { hook: 'status_code' },
    timeout: { hook: 'timeout' },
  }),
  props: {
    url: 'string',
    method: 'string',
    status_code: 'string',
  },
  initialize () {
    GenericCollapsedContent.prototype.initialize.apply(this,arguments)
    this.listenToAndRun(this.monitor,'change:config',this.updateState)
  },
  updateState () {
    if (!this.monitor.config) return
    this.url = this.monitor.config.url
    this.method = this.monitor.config.method
    this.status_code = String(this.monitor.config.status_code)
  },
  derived: {
    timeout: {
      deps: ['monitor.config'],
      fn () {
        if (!this.monitor.config) return
        const time = this.monitor.config.timeout
        return (time / 1000) + ' s'
      }
    }
  }
})

const ProcessCollapsedContent = GenericCollapsedContent.extend({
  template: `
    <div class="task-container">
      <p><i data-hook="name"></i></p>
      <p>This monitor is executed on <i data-hook="hostname"></i> every <i data-hook="interval"></i></p>
      <i data-hook="description"></i>
      <h4>Process details</h4>
      <table class="table table-stripped">
        <thead>
          <tr data-hook="title-cols">
            <th>Is Regexp</th>
            <th>Search Pattern</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span data-hook="is_regexp" class="fa"></span></td>
            <td><span data-hook="pattern"></span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  bindings: assign({}, bindings, {
    is_regexp: {
      hook: 'is_regexp',
      type: 'booleanClass',
      yes: 'fa-check-square-o',
      no: 'fa-square-o'
    },
    pattern: { hook: 'pattern' }
  }),
  props: {
    is_regexp: ['boolean',false,false],
    pattern: ['string',false,'']
  },
  initialize () {
    GenericCollapsedContent.prototype.initialize.apply(this,arguments)

    this.listenToAndRun(this.monitor,'change:config',this.updateState)
  },
  updateState () {
    if (!this.monitor.config || !this.monitor.config.ps) return
    this.is_regexp = this.monitor.config.ps.is_regexp
    this.pattern = this.monitor.config.ps.pattern
  }
})

const ScriptCollapsedContent = GenericCollapsedContent.extend({
  template: `
    <div class="task-container">
      <p><i data-hook="name"></i></p>
      <p>This monitor is executed on <i data-hook="hostname"></i> every <i data-hook="interval"></i></p>
      <i data-hook="description"></i>
      <h4>Script details</h4>
      <table class="table table-stripped">
        <thead>
          <tr data-hook="title-cols">
            <th></th>
            <th>Description</th>
            <th>Filename</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            <td><span data-hook="script_description"></span></td>
            <td><span data-hook="script_filename"></span></td>
            <td><span data-hook="script_language"></span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  events: {
    'click button[data-hook=edit_script]': 'onClickEditScript'
  },
  onClickEditScript (event) {
    event.preventDefault()
    event.stopPropagation()

    if (!this.script_id) return

    // App.actions.file.edit(this.script_id)

    return false
  },
  initialize () {
    GenericCollapsedContent.prototype.initialize.apply(this,arguments)

    this.listenToAndRun(this.monitor,'change:config',this.updateState)
  },
  props: {
    extension: 'string',
    filename: 'string',
    description: 'string',
    script_id: 'string'
  },
  derived: {
    formatted_description: {
      deps: ['monitor.description'],
      fn () {
        return this.monitor.description || 'no details'
      }
    },
    language: {
      deps: ['extension'],
      fn () {
        return lang2ext.langFor[this.extension]
      }
    },
  },
  bindings: assign({}, bindings, {
    formatted_description: { hook: 'description' },
    filename: { hook: 'script_filename' },
    language: { hook: 'script_language' },
    description: { hook: 'script_description' },
    // disable button when not available
    script_id: {
      hook: 'edit_script',
      type: 'booleanAttribute',
      name: 'disabled',
      invert: true
    }
  }),
  updateState () {
    if (!this.monitor.config || !this.monitor.config.script) return
    const script = this.monitor.config.script
    this.script_id = script.id
    this.extension = script.extension
    this.filename = script.filename
    this.description = script.description
  },
  // render () {
  //   this.renderWithTemplate(this)
  //   if (acls.hasAccessLevel('admin')) {
  //     this.query('tbody tr').innerHTML += `<td><button title="edit the script" data-hook="edit_script" class="fa fa-edit btn btn-sm btn-primary"></button></td>`
  //   }
  // }
})

const FileCollapsedContent = GenericCollapsedContent.extend({
  template: `
    <div class="task-container">
      <p><i data-hook="name"></i></p>
      <p>This monitor is executed on <i data-hook="hostname"></i> every <i data-hook="interval"></i></p>
      <i data-hook="description"></i>
      <h4>File details</h4>
      <table class="table table-stripped">
        <thead>
          <tr data-hook="title-cols">
            <th></th>
            <th>Directory</th>
            <th>Filename</th>
            <th>Username</th>
            <th>Groupname</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            <td><span data-hook="dirname"></span></td>
            <td><span data-hook="basename"></span></td>
            <td><span data-hook="os_username"></span></td>
            <td><span data-hook="os_groupname"></span></td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  bindings: assign({}, bindings, {
    dirname: { hook: 'dirname' },
    basename: { hook: 'basename' },
    os_username: { hook: 'os_username' },
    os_groupname: { hook: 'os_groupname' },
    file_id: {
      hook: 'edit_file',
      type: 'booleanAttribute',
      name: 'disabled',
      invert: true
    }
  }),
  props: {
    dirname: 'string',
    basename: 'string',
    os_username: 'string',
    os_groupname: 'string',
    file_id: 'string'
  },
  initialize () {
    GenericCollapsedContent.prototype.initialize.apply(this,arguments)

    this.listenToAndRun(this.monitor,'change:config',this.updateState)
  },
  updateState () {
    if (!this.monitor.config) return
    const config = this.monitor.config
    this.file_id = config.file
    this.dirname = config.dirname
    this.basename = config.basename
    this.os_username = config.os_username || 'not specified'
    this.os_groupname = config.os_groupname || 'not specified'
  },
  events: {
    'click button[data-hook=edit_file]': 'onClickEditFile'
  },
  onClickEditFile (event) {
    event.preventDefault()
    event.stopPropagation()

    if (!this.file_id) return

    // App.actions.file.edit(this.file_id)

    return false
  },
  // render () {
  //   this.renderWithTemplate(this)
  //   if ( acls.hasAccessLevel('admin') ) {
  //     this.query('tbody tr').innerHTML += `<td><button title="edit the script" data-hook="edit_file" class="fa fa-edit btn btn-sm btn-primary"></button></td>`
  //   }
  // }
})

const HostCollapsedContent = GenericCollapsedContent.extend({
  template: `
    <div>
      <p>This is <i data-hook="hostname"></i> keep alive.</p>

      <h4>
        <i class="fa theeye-robot-solid"></i>
        Host monitor state: <i data-hook="host_state"></i>
      </h4>
      <h4 data-hook="psaux_state_section">
        <i class="fa fa-cogs"></i>
        Processes monitor state: <i data-hook="psaux_state"></i>
      </h4>

      <section data-hook="dstat_state_section">
        <h4>
           <i class="fa fa-bar-chart"></i>
          Health monitor state: <i data-hook="dstat_state"></i>
        </h4>

        <span>Host health values</span>
        <table class="table table-stripped">
          <thead>
            <tr data-hook="title-cols">
              <th></th>
              <th>CPU %</th>
              <th>Memory %</th>
              <th>Disk %</th>
              <th>Cache %</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td></td>
              <td><span data-hook="cpu"></span></td>
              <td><span data-hook="mem"></span></td>
              <td><span data-hook="disk" style="white-space: pre-line"></span></td>
              <td><span data-hook="cache"></span></td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  `,
  bindings: assign({}, bindings, {
    'dstat': {
      hook: 'dstat_state_section',
      type: 'toggle'
    },
    'psaux': {
      hook: 'psaux_state_section',
      type: 'toggle'
    },
    'host.stateIcon': {
      hook: 'host_state',
      type: 'attribute',
      name: 'class'
    },
    'dstat.stateIcon': {
      hook: 'dstat_state',
      type: 'attribute',
      name: 'class'
    },
    'psaux.stateIcon': {
      hook: 'psaux_state',
      type: 'attribute',
      name: 'class'
    },
    dstat_cache: { hook: 'cache' },
    dstat_mem: { hook: 'mem' },
    dstat_cpu: { hook: 'cpu' },
    dstat_disk: { hook: 'disk' }
  }),
  props: {
    host: 'state',
    dstat: 'state',
    psaux: 'state',
    dstat_cache: 'string',
    dstat_mem: 'string',
    dstat_cpu: 'string',
    dstat_disk: 'string'
  },
  initialize () {
    GenericCollapsedContent.prototype.initialize.apply(this,arguments)
    this.listenToAndRun(this.monitor,'change:config',this.updateState)

    if (this.dstat && this.dstat.monitor) {
      this.listenToAndRun(this.dstat.monitor,'change:config',this.updateDstatState)
      this.listenToAndRun(this.dstat,'change:last_event',this.updateDstatState)
    }
  },
  updateState () {
    return
  },
  updateDstatState () {
    const config = this.dstat.monitor.config
    const lastEvent = this.dstat.last_event
    if (!config || !config.limit || !lastEvent || !lastEvent.data) return

    const data = lastEvent.data
    if (data.error) {
      console.warn('stats data error', data)
      return
    }

    if (data.disk) {
      var disksValue = ''
      data.disk.forEach(function(disk){
        disksValue = [
          disksValue,
          disk.name,
          ': ',
          String(Math.floor(disk.value)),
          ' / ',
          String(config.limit.disk),
          "\n"
        ].join('')
      })
      this.dstat_disk = disksValue
    }

    if (data.cache || data.cache === 0) {
      this.dstat_cache = String(Math.floor(data.cache)) + ' / ' + String(config.limit.cache)
    }

    if (data.cpu || data.cpu === 0) {
      this.dstat_cpu = String(Math.floor(data.cpu)) + ' / ' + String(config.limit.cpu)
    }

    if (data.mem || data.mem === 0) {
      this.dstat_mem = String(Math.floor(data.mem)) + ' / ' + String(config.limit.mem)
    }
  }
})

const NestedMonitorRowView = View.extend({
  template: `
    <tr>
      <td>
        <h4><i data-hook="name"></i></h4>
      </td>
      <td>
        <h4><i data-hook="state-icon"></i></h4>
      </td>
    </tr>
  `,
  bindings: {
    'model.name': { hook:'name'},
    'model.stateIcon': {
      hook: 'state-icon',
      type: 'attribute',
      name: 'class'
    },
  }
})

const NestedCollapsedContent = GenericCollapsedContent.extend({
  template: `
    <div>
      <p>Nested Monitors</p>
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody data-hook="nested-monitors-container">
        </tbody>
      </table>
    </div>
  `,
  render () {
    this.renderWithTemplate(this)

    let nestedMonitors = this.monitor.config.monitors
    this.renderCollection(
      nestedMonitors,
      NestedMonitorRowView,
      this.queryByHook('nested-monitors-container')
    )
  }
})

exports.Factory = (input) => {
  const type = input.model.type

  // re-assign to internal properties
  const options = assign({}, input, {
    resource: input.model,
    monitor: input.model.monitor
  })

  if (type==='scraper') return new ScraperCollapsedContent(options)
  if (type==='script') return new ScriptCollapsedContent(options)
  if (type==='process') return new ProcessCollapsedContent(options)
  if (type==='file') return new FileCollapsedContent(options)
  if (type==='host') return new HostCollapsedContent(options)
  if (type==='nested') return new NestedCollapsedContent(options)
  return new GenericCollapsedContent(options)
}

exports.HostContent = HostCollapsedContent
