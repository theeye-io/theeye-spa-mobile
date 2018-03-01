import bootbox from 'bootbox'
import JobActions from 'actions/job'
import View from 'ampersand-view'
import ladda from 'ladda'
const logger = require('lib/logger')('page:dashboard:task:exec-button')
import LIFECYCLE from 'constants/lifecycle'
import AnalyticsActions from 'actions/analytics'

import DinamicForm from 'components/dinamic-form'
import Modalizer from 'components/modalizer'

import './styles.less'

const runTaskWithArgsMessage = require('./run-task-message.hbs')

module.exports = View.extend({
  template: `
    <li class="task-exec-button">
      <button data-hook="trigger"
        class="ladda-button btn btn-primary tooltiped"
        title="Run this task"
        data-spinner-size="30"
        data-style="zoom-in">
        <i class="fa fa-play" aria-hidden="true"></i>
      </button>
    </li>
  `,
  events: {
    'click button[data-hook=trigger]':'onClickTrigger',
  },
  askDinamicArguments (next) {
    if (this.model.hasDinamicArguments) {
      const form = new DinamicForm ({
        fieldsDefinitions: this.model.taskArguments.models
      })

      const modal = new Modalizer({
        buttons: true,
        confirmButton: 'Run',
        title: `Run ${this.model.name} with dynamic arguments`,
        bodyView: form
      })

      this.listenTo(modal,'shown',() => { form.focus() })

      this.listenTo(modal,'hidden',() => {
        form.remove()
        modal.remove()
      })

      this.listenTo(modal,'confirm',() => {
        /**
         * @param {Object} args a {key0: value0, key1: value1, ...} object with each task argument
         */
        form.submit( (err,args) => {
          const labels = Object.keys(args)
          next(
            labels.map( (label) => {
              return {
                order: this.model.taskArguments.get(label,'label').order,
                label: label,
                value: args[label]
              }
            })
          )
          modal.hide()
        })
      })
      modal.show()
    } else {
      //next( this.model.taskArguments.models )
      next([])
    }
  },
  onClickTrigger (event) {
    event.stopPropagation()
    event.preventDefault()

    if (this.model.lastjob.inProgress) {
      const message = `Cancel task <b>${this.model.name}</b> execution?
        <a target="_blank" href="https://github.com/theeye-io/theeye-docs/blob/master/tasks/cancellation">Why this happens?</a>`

      bootbox.confirm({
        message: message,
        backdrop: true,
        callback: (confirmed) => {
          if (confirmed) {
            JobActions.cancel(this.model)
          }
        }
      })
    } else {
      if (!this.model.canExecute) return

      this.askDinamicArguments(taskArgs => {
        let message
        if (taskArgs.length>0) {
          message = runTaskWithArgsMessage({
            name: this.model.name,
            args: taskArgs
          })
        } else {
          message = `
            <h2>You are about to run the task <b>${this.model.name}</b></h2>
            <h2>Continue?</h2>
            `
        }

        bootbox.confirm({
          message: message,
          backdrop: true,
          callback: (confirmed) => {
            if (confirmed) {
              JobActions.create(this.model, taskArgs)

              AnalyticsActions.trackEvent('Task', 'Execution', this.model.id)
            }
          }
        })
      })
    }

    return false
  },
  initialize () {
    View.prototype.initialize.apply(this,arguments)
  },
  render () {
    this.renderWithTemplate()

    this.lbutton = ladda.create( this.queryByHook('trigger') )

    this.listenToAndRun(this.model.lastjob,'change:lifecycle',() => {
      this.checkJobLifecycle()
    })
  },
  //props: {
  //  disabled: ['boolean',false,false]
  //},
  //bindings: {
  //  disabled: {
  //    hook: 'trigger',
  //    type: 'booleanAttribute',
  //    name: 'disabled'
  //  }
  //},
  checkJobLifecycle () {
    const lifecycle = this.model.lastjob.lifecycle
    switch (lifecycle) {
      case LIFECYCLE.FINISHED:
      case LIFECYCLE.TERMINATED:
      case LIFECYCLE.COMPLETED:
      case LIFECYCLE.EXPIRED:
      case LIFECYCLE.CANCELED:
        this.lbutton.stop()
        break;
      case LIFECYCLE.READY:
      case LIFECYCLE.ASSIGNED:
        this.lbutton.start()
        this.queryByHook('trigger').removeAttribute('disabled')
        break;
      default:
        logger.error('no lifecycle')
        break;
    }
  }
})
