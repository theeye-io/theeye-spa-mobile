import App from 'ampersand-app'
import bootbox from 'bootbox'
import DynamicForm from 'view/dynamic-form'
import Modalizer from 'components/modalizer'
import { BaseExec } from '../../exec-task.js'
import FIELD from 'constants/field'
import moment from 'moment'
import isURL from 'validator/lib/isURL'
import fileDownloader from 'lib/file-downloader'
import $ from 'jquery'

const ExecJob = BaseExec.extend({
  execute () {
    if (this.model.inProgress) {
      const message = `Cancel <b>${this.model.name}</b> the execution of this task?
        <a target="_blank" href="https://github.com/theeye-io/theeye-docs/blob/master/tasks/cancellation">Why this happens?</a>`

      bootbox.confirm({
        message: message,
        backdrop: true,
        callback: (confirmed) => {
          if (confirmed) {
            App.actions.job.cancel(this.model)
          }
        }
      })
    }
  }
})

exports.ExecJob = ExecJob

const ExecApprovalJob = BaseExec.extend({
  getDynamicOutputs (next) {
    if (this.model.hasDynamicOutputs) {
      const form = new DynamicForm({
        fieldsDefinitions: this.model.task.output_parameters
      })

      const modal = new Modalizer({
        buttons: true,
        confirmButton: 'Run',
        title: `Run ${this.model.name} with dynamic arguments`,
        bodyView: form
      })

      this.listenTo(modal, 'shown', () => { form.focus() })

      this.listenTo(modal, 'hidden', () => {
        form.remove()
        modal.remove()
      })

      this.listenTo(modal, 'confirm', () => {
        /**
         * @param {Object} args a {key0: value0, key1: value1, ...} object with each task argument
         */
        form.submit((err, args) => {
          const orders = Object.keys(args)
          next(
            orders.map((order) => {
              return {
                order: parseInt(order),
                label: this.model.taskModel.output_parameters.get(parseInt(order), 'order').label,
                value: args[order],
                type: this.model.taskModel.output_parameters.get(parseInt(order), 'order').type
              }
            })
          )
          modal.hide()
        })
      })
      modal.show()
    } else {
      next([])
    }
  },
  execute (isPendingCheck, done) {
    if (this.model.inProgress) {
      if (this.model.isApprover(App.state.session.user.id)) {
        this.requestApproval(isPendingCheck, done)
      } else {
        if (!isPendingCheck) {
          this.updateApprovalRequest(done)
        }
      }
    }
  },
  requestApproval (isPendingCheck, done) {
    let message = buildMessage(this.model)

    var buttons = {
      reject: {
        label: 'Reject',
        className: 'btn btn-danger',
        callback: () => {
          this.getDynamicOutputs(jobArgs => {
            jobArgs = this.parseArgs(jobArgs)
            App.actions.job.reject(this.model, jobArgs)
            if (done) done()
          })
        }
      },
      approve: {
        label: 'Approve',
        className: 'btn btn-primary',
        callback: () => {
          this.getDynamicOutputs(jobArgs => {
            jobArgs = this.parseArgs(jobArgs)
            App.actions.job.approve(this.model, jobArgs)
            if (done) done()
          })
        }
      }
    }

    if (isPendingCheck) {
      buttons.skip = {
        label: 'Skip',
        className: 'btn btn-default',
        callback: () => {
          App.actions.approval.skip(this.model)
          if (done) done()
        }
      }
    }

    bootbox.dialog({
      message: message,
      backdrop: true,
      closeButton: (App.state.session.user.credential==='root'),
      buttons: buttons
    })

    $('.url-download').click(function () {
      let data = $(this)[0].href
      fileDownloader.urlDownload(data)
    })

    $('.base64-download').click(function () {
      let data = $(this)[0].href
      fileDownloader.base64Download(data)
    })
  },
  updateApprovalRequest (done) {
    const message = `The Approval request is pending. Cancel approval request?`

    bootbox.dialog({
      message: message,
      backdrop: true,
      //closeButton: (App.state.session.user.credential==='root'),
      buttons: {
        cancel: {
          label: 'Cancel request',
          className: 'btn btn-danger',
          callback: () => {
            App.actions.job.cancel(this.model)
            if (done) done()
          }
        }
      }
    })
  }
})

exports.ExecApprovalJob = ExecApprovalJob

const buildMessage = function (model) {
  let params = model.task.task_arguments
  let values = model.task_arguments_values
  let message = `<p>Task <b>${model.name}</b> needs your approval to continue.</p>`

  if (params.length) {
    message += '<br><p><b>Please verify this information: </b></p><br>'
  }

  params.forEach(function (param, index) {
    let line = `<p>${param.label}: `
    switch (param.type) {
      case FIELD.TYPE_FIXED:
      case FIELD.TYPE_INPUT:
        if (isURL(values[index])) {
          line += `<a class='url-download' href='${values[index]}' download='file${index + 1}'>Download</a>`
        } else {
          line += values[index]
        }
        break
      case FIELD.TYPE_DATE:
        line += moment(values[index]).format('D-MMM-YY, HH:mm:ss')
        break
      case FIELD.TYPE_FILE:
        if (isURL(values[index])) {
          line += `<a class='url-download' href='${values[index]}' download='file${index + 1}'>Download</a>`
        } else {
          line += `<a class='base64-download' href='${values[index]}' download='file${index + 1}'>Download</a>`
        }
        break
      case FIELD.TYPE_SELECT:
        break
      case FIELD.TYPE_REMOTE_OPTIONS:
        break
      default:
    }
    line += '</p>'
    message += line
  })

  return message
}
