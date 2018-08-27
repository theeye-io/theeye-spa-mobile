'use strict'

import App from 'ampersand-app'
import XHR from 'lib/xhr'
import bootbox from 'bootbox'
import TaskConstants from 'constants/task'
import LifecycleConstants from 'constants/lifecycle'
import JobConstants from 'constants/job'
import { ExecApprovalJob } from 'view/page/dashboard/task/task/collapse/job/exec-job'
import { eachSeries, each } from 'async'
import { Factory as JobFactory } from 'models/job'
const logger = require('lib/logger')('actions:jobs')

module.exports = {
  /**
   *
   * @summary this is being updated via socket event
   * @param {Object} data job model properties
   *
   */
  applyStateUpdate (data) {
    let workflow
    if (data._type==='WorkflowJob') {
      workflow = App.state.workflows.get(data.workflow_id)

      if (!workflow) {
        logger.error('workflow not found in state')
        logger.error('%o', data)
        return
      }
      // workflow job created
      workflow.jobs.add(data, { merge: true })
    } else {
      const task = App.state.tasks.get(data.task_id)

      if (!task) {
        logger.error('task not found in state')
        logger.error('%o', data)
        return
      }

      const tjob = new JobFactory(data, {})

      if (task.workflow_id) {
        // get the workflow
        workflow = App.state.workflows.get(task.workflow_id)
        if (!workflow) { // error
          logger.error('workflow not found in state')
          logger.error('%o', data)
          return
        }

        // get the job
        let wjob = workflow.jobs.get(tjob.workflow_job_id)
        if (!wjob) { } // async error?
        wjob.jobs.add(tjob)
      } else {
        task.jobs.add(tjob)
      }
      this.handleApprovalTask(tjob, task)
    }
  },
  /**
   *
   *
   *
   */
  createFromTask (task, args) {
    logger.log('creating new job with task %o', task)

    if (!task.workflow_id) {
      createSingleTaskJob(task, args)
    } else {
      let workflow = App.state.workflows.get(task.workflow_id)
      createWorkflowJob(workflow, args)
    }
  },
  cancel (job) {
    XHR.send({
      method: 'put',
      url: `${App.config.api_url}/job/${job.id}/cancel`,
      headers: {
        Accept: 'application/json;charset=UTF-8'
      },
      done (data,xhr) {
        logger.debug('job canceled')
        job.set('lifecycle', LifecycleConstants.CANCELED)
      },
      fail (err,xhr) {
        bootbox.alert('something goes wrong')
        console.log(arguments)
      }
    })
  },
  approve (job, args) {
    args = args || []
    XHR.send({
      method: 'put',
      url: `${App.config.api_v3_url}/job/${job.id}/approve`,
      jsonData: {
        result: {
          state: 'success',
          data: {
            args,
            output: args.map(arg => arg.value)
          }
        }
      },
      headers: {
        Accept: 'application/json;charset=UTF-8'
      },
      done (data,xhr) {
        logger.debug('job approved')
        //job.clear()
        //job.result.clear()
        //job.set('lifecycle', LifecycleConstants.CANCELED)
      },
      fail (err,xhr) {
        bootbox.alert('something goes wrong')
        console.log(arguments)
      }
    })
  },
  reject (job, args) {
    args = args || []
    XHR.send({
      method: 'put',
      url: `${App.config.api_v3_url}/job/${job.id}/reject`,
      jsonData: {
        result: {
          state: 'failure',
          data: {
            args,
            output: args.map(arg => arg.value)
          }
        }
      },
      headers: {
        Accept: 'application/json;charset=UTF-8'
      },
      done (data,xhr) {
        logger.debug('job rejected')
        //job.clear()
        //job.result.clear()
        //job.set('lifecycle',LifecycleConstants.CANCELED)
      },
      fail (err,xhr) {
        bootbox.alert('something goes wrong')
        console.log(arguments)
      }
    })
  },
  /**
   *
   * @summary check if should show approval modal
   * @param {Object} data job model properties
   *
   */
  handleApprovalTask (job, task) {
    var requestApproval = (
      job._type === JobConstants.APPROVAL_TYPE &&
      task.isApprover(App.state.session.user.id) &&
      job.lifecycle === LifecycleConstants.ONHOLD
    )

    if (requestApproval) {
      var execApprovalJob = new ExecApprovalJob({model: job})
      execApprovalJob.execute(true)
    }
  },
  checkPedingApprovals () {
    const userTasksToApprove = App.state.tasks.models.filter((task) => {
      let check = (
        task.type === TaskConstants.TYPE_APPROVAL &&
        task.isApprover(App.state.session.user.id)
      )
      return check
    })

    if (userTasksToApprove.length===0) { return }

    each(userTasksToApprove, function (task, done) {
      task.fetchJobs({}, done)
    }, function (err) {
      if (err) { return }

      let pendingApprovalJobs = []
      userTasksToApprove.forEach(function (task) {
        task.jobs.models.forEach(function (job) {
          if (job.lifecycle === LifecycleConstants.ONHOLD) {
            pendingApprovalJobs.push(job)
          }
        })
      })

      eachSeries(pendingApprovalJobs, function (job, done) {
        var execApprovalJob = new ExecApprovalJob({model: job})
        execApprovalJob.execute(true, done)
      })
    })
  }
}

const createWorkflowJob = (workflow, args) => {
  logger.log('creating new job with workflow %o', workflow)

  let body = {
    task: workflow.start_task_id,
    task_arguments: args
  }

  XHR.send({
    method: 'post',
    url: `${App.config.api_v3_url}/workflow/${workflow.id}/job`,
    jsonData: body,
    headers: {
      Accept: 'application/json;charset=UTF-8'
    },
    done (job, xhr) {
      logger.debug('job created. updating workflow')
      //wait for socket update arrive and create there
      //workflow.jobs.add(job, { merge: true })
    },
    fail (err,xhr) {
      bootbox.alert('Job creation failed')
      console.log(arguments)
    }
  })
}

const createSingleTaskJob = (task, args) => {
  let body = {
    task: task.id,
    task_arguments: args
  }

  XHR.send({
    method: 'post',
    url: `${App.config.api_url}/job`,
    jsonData: body,
    headers: {
      Accept: 'application/json;charset=UTF-8'
    },
    done (data,xhr) {
      logger.debug('job created. updating task')
      task.jobs.add(data, { merge: true })
    },
    fail (err,xhr) {
      bootbox.alert('Job creation failed')
      console.log(arguments)
    }
  })
}
