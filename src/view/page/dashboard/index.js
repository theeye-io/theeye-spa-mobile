'use strict'

import App from 'ampersand-app'
import config from 'config'
import View from 'ampersand-view'
import $ from 'jquery'
// import StatsPanelView from './stats-panel'
import TaskRowView from './task'
import MonitorRowView from './monitor'
import RunAllTasksButton from './task/run-all-button'
import JobActions from 'actions/job'
import TaskActions from 'actions/task'
import WorkflowActions from 'actions/workflow'
import bootbox from 'bootbox'

// const logger = require('lib/logger')('view:page:dashboard')
const ItemsFolding = require('./panel-items-fold')
const searchRows = require('lib/filter-rows')

import MonitorsOptions from './monitors-options'
import MonitoringOboardingPanel from './monitoring-onboarding'
import TasksOboardingPanel from './tasks-onboarding'
// import PlusMenuButton from './plus-menu-button'
// import acls from 'lib/acls'
// import NotificationActions from 'actions/notifications'
import DashboardActions from 'actions/dashboard'
import AnalyticsActions from 'actions/analytics'
import InboxView from './inbox'

// import onBoarding from './onboarding'

var slideCount, slideWidth, sliderUlWidth

const runAllTasks = (rows) => {
  // doble check here
  if (rows.length > 0) {
    const tasks = rows.map(row => row.model)

    const boxTitle = `With great power comes great responsibility`
    const boxMessage = `You are going to run various tasks.<br> This operation cannot be canceled`

    bootbox.confirm({
      title: boxTitle,
      message: boxMessage,
      backdrop: true,
      buttons: {
        confirm: {
          label: 'Run All',
          className: 'btn-danger'
        },
        cancel: {
          label: 'Maybe another time...',
          className: 'btn-default'
        }
      },
      callback (confirmed) {
        if (confirmed === true) {
          tasks.forEach(task => {
            if (/Workflow/.test(task._type)) {
              WorkflowActions.triggerExecution(task)
            } else {
              TaskActions.execute(task)
            }
          })
        }
      }
    })
  }
}

/**
 *
 * @author Facugon
 * @module DashboardPage
 * @namespace Views
 *
 * @summary page index, main view. all the other views render inside this
 *
 */
module.exports = View.extend({
  autoRender: true,
  template: require('./page.hbs'),
  props: {
    groupedResources: 'collection',
    monitors: 'collection',
    tasks: 'collection',
    renderStats: ['boolean', false, false],
    renderTasks: ['boolean', false, true],
    waitTimeout: ['number', false, null],
    upandrunningSign: ['boolean', false, () => {
      let enabled = config.dashboard.upandrunningSign
      return typeof enabled === 'boolean' ? enabled : true
    }],
    unread: ['number', true, 0],
    showBadge: ['boolean', false, false],
    notifications: 'collection'
  },
  bindings: {
    unread: [
      {
        type: 'text',
        hook: 'notifications-badge'
      },
      {
        type: 'toggle',
        hook: 'notifications-badge'
      }
    ]
  },
  events: {
    'click [data-hook=up-and-running] i': 'hideUpAndRunning',
    'click [data-hook=show-monitors]': 'setCurrentTab',
    'click [data-hook=show-tasks]': 'setCurrentTab',
    'click [data-hook=show-notifications]': 'setCurrentTab'
  },
  initialize () {
    View.prototype.initialize.apply(this, arguments)
    this.listenToAndRun(this.notifications, 'add sync reset remove', this.updateCounts)
  },
  hideUpAndRunning () {
    this.$upandrunning.slideUp()
    this.$monitorsPanel.slideDown()
    this.upandrunningSign = false
    this.stopListening(this.monitors, 'sync change:state', this.setUpAndRunningSign)
  },
  render () {
    var self = this

    this.renderWithTemplate()

    this.listenToAndRun(App.state.dashboard, 'change:resourcesDataSynced', () => {
      if (App.state.dashboard.resourcesDataSynced === true) {
        this.renderMonitorsPanel()
        this.stopListening(App.state.dashboard, 'change:resourcesDataSynced')
        this.setSliderSizes()
      }
    })

    if (this.renderTasks === true) {
      this.listenToAndRun(App.state.dashboard, 'change:tasksDataSynced', () => {
        if (App.state.dashboard.tasksDataSynced === true) {
          this.renderTasksPanel()
          this.stopListening(App.state.dashboard, 'change:tasksDataSynced')
          this.setSliderSizes()
        }
      })
    } else {
      // remove panel container
      this.queryByHook('tasks-panel').remove()
    }

    // if (this.renderStats === true) {
    //   this.renderSubview(
    //     new StatsPanelView(),
    //     this.queryByHook('.admin-container.dashboard')
    //   )
    // }

    // this.onBoarding = new onBoarding()

    // if (acls.hasAccessLevel('admin')) {
    //   this.renderPlusButton()
    // }

    document.getElementsByClassName('navbar')[0].style.display = 'block'

    // notifications inbox
    this.inbox = new InboxView({collection: this.notifications})
    this.renderSubview(
      this.inbox,
      this.queryByHook('notifications-container')
    )

    $(window).resize(function () {
      self.setSliderSizes()
    })

    window.screen.orientation.onchange = function () {
      self.setSliderSizes()
    }

    this.listenToAndRun(App.state.dashboard, 'change:currentTab', () => {
      this.setSliderSizes()
      if (!App.state.dashboard.currentTab) {
        return
      }
      AnalyticsActions.trackView(App.state.dashboard.currentTab)
      switch (App.state.dashboard.currentTab) {
        case 'monitors':
          this.showTab(App.state.dashboard.currentTab, 0)
          break
        case 'tasks':
          this.showTab(App.state.dashboard.currentTab, -slideWidth)
          break
        case 'notifications':
          this.showTab(App.state.dashboard.currentTab, -(slideWidth * 2))
          break
      }
    })
  },
  setUpAndRunningSign: function () {
    if (!this.upandrunningSign) {
      // upandrunning is disabled
      return
    }
    if (this.waitTimeout) {
      // the user is interacting
      return
    }
    if (!(this.monitors.length > 0)) {
      return
    }

    const failing = this.getFailingMonitors()

    if (failing.length > 0) {
      this.$upandrunning.slideUp()
      this.$monitorsPanel.slideDown()
    } else {
      this.$upandrunning.slideDown()
      this.$monitorsPanel.slideUp()
    }
  },
  sortGroupedResouces: function () {
    if (!(this.groupedResources.length > 0)) return

    const failing = this.getFailingMonitors()

    /** move ok monitors to fold container **/
    const foldMonitors = () => {
      this.monitorRows.views.forEach(view => {
        let model = view.model
        if (!model.hasError()) {
          this.monitorsFolding.append(view.el)
        } else {
          this.$monitorsPanel.prepend(view.el)
        }
      })
    }

    /** restore to default **/
    const unfoldMonitors = () => {
      this.monitorRows.views.forEach(view => {
        this.$monitorsPanel.append(view.el)
      })
    }

    if (failing.length > 0) {
      foldMonitors()
      this.monitorsFolding.showButton()
    } else {
      unfoldMonitors()
      this.monitorsFolding.hideButton()
    }
  },
  getFailingMonitors () {
    return this.monitors.filter(monitor => {
      let group = this.groupedResources.find(monitor)
      if (!group) return false
      return monitor.hasError()
    })
  },
  /**
   *
   * should be converted into a Monitors Panel View
   *
   */
  renderMonitorsPanel () {
    this.$upandrunning = $(this.queryByHook('up-and-running'))
    this.$monitorsPanel = $(this.queryByHook('monitors-container'))

    this.renderSubview(
      new MonitorsOptions(),
      this.queryByHook('monitors-panel-header')
    )

    this.monitorRows = this.renderCollection(
      this.groupedResources,
      MonitorRowView,
      this.queryByHook('monitors-container'),
      {
        emptyView: MonitoringOboardingPanel
      }
    )

    const rowtooltips = this.query('[data-hook=monitors-container] .tooltiped')
    $(rowtooltips).tooltip()

    this.monitorsFolding = this.renderSubview(
      new ItemsFolding({}),
      this.queryByHook('monitors-fold-container')
    )

    /** bind searchbox **/
    this.listenToAndRun(App.state.searchbox, 'change:search', () => {
      if (this.monitorRows) {
        searchRows({
          rows: this.monitorRows.views,
          search: App.state.searchbox.search,
          onrow: (row, hit) => {
            row.show = Boolean(hit)
          },
          onsearchend: () => {
            this.monitorRows.views.forEach(row => (row.show = true))
          }
        })
      }
      if (App.state.searchbox.search) {
        this.hideUpAndRunning()
        this.monitorsFolding.unfold()
      } else {
        this.monitorsFolding.fold()
        // this.setUpAndRunningSign()
      }
    })

    // this.listenToOnce(App.state.onboarding, 'first-host-registered', () => {
    //   this.onBoarding.onboardingStart()
    // })

    this.listenToAndRun(App.state.dashboard.groupedResources, 'add change sync reset', () => {
      var monitorOptionsElem = this.queryByHook('monitor-options')
      if (App.state.dashboard.groupedResources.length > 0) {
        if (monitorOptionsElem) {
          monitorOptionsElem.style.visibility = ''
        }
        if (this.monitorsFolding) {
          this.monitorsFolding.showButton()
        }
      } else {
        if (monitorOptionsElem) {
          monitorOptionsElem.style.visibility = 'hidden'
        }
        if (this.monitorsFolding) {
          this.monitorsFolding.hideButton()
        }
      }
      this.sortGroupedResouces()
    })

    this.listenToAndRun(App.state.tasks, 'add sync reset', () => {
      if (this.tasksFolding) {
        if (App.state.tasks.length > 0) {
          this.tasksFolding.showButton()
        } else {
          this.tasksFolding.hideButton()
        }
      }
    })

    this.listenTo(this.monitors, 'sync change:state', this.setUpAndRunningSign)
    this.listenTo(this.monitors, 'add', () => {
      this.monitorsFolding.unfold()
      App.state.dashboard.groupResources()
    })
  },
  /**
   *
   * should be converted into a Tasks Panel View
   *
   */
  renderTasksPanel () {
    const taskRows = this.renderCollection(
      this.tasks,
      TaskRowView,
      this.queryByHook('tasks-container'),
      {
        emptyView: TasksOboardingPanel
      }
    )

    const runAllButton = new RunAllTasksButton({
      el: this.queryByHook('run-all-tasks')
    })
    runAllButton.render()
    this.registerSubview(runAllButton)

    this.listenTo(runAllButton, 'runall', () => {
      const rows = taskRows.views.filter(row => {
        return row.model.canExecute && row.show === true
      })
      runAllTasks(rows)
    })

    const rowtooltips = this.query('[data-hook=tasks-container] .tooltiped')
    $(rowtooltips).tooltip()

    this.tasksFolding = this.renderSubview(
      new ItemsFolding({}),
      this.queryByHook('tasks-fold-container')
    )

    taskRows.views.forEach(row => {
      let task = row.model
      if (!task.canExecute) {
        this.tasksFolding.append(row.el)
      }
    })

    const search = () => {
      if (taskRows) {
        searchRows({
          rows: taskRows.views,
          search: App.state.searchbox.search,
          onrow: (row, isHit) => {
            if (row.model.canExecute) {
              row.show = isHit
            } else {
              row.show = false
            }
          },
          onsearchend: () => {
            taskRows.views.forEach(row => (row.show = true))
          }
        })

        runAllButton.visible = Boolean(App.state.searchbox.search)

        if (App.state.searchbox.search.length > 3) {
          const rows = taskRows.views.filter(row => row.show === true)
          if (!rows || rows.length === 0) {
            // no rows to show
            runAllButton.disabled = true
          } else {
            // verify if all the tasks are not being executed
            const nonExecutableTasks = rows
              .map(row => row.model)
              .find(task => {
                if (/Task/.test(task._type)) {
                  return !task.canBatchExecute
                }
                if (/Workflow/.test(task._type)) {
                  var WFNotExecutable = false
                  task.tasks.models.forEach(function (wfTask) {
                    if (!wfTask.canBatchExecute) {
                      WFNotExecutable = true
                    }
                  })
                  return WFNotExecutable
                }
              })

            runAllButton.disabled = (nonExecutableTasks !== undefined)
          }
        } else {
          runAllButton.disabled = true
        }
      }
    }

    this.listenToAndRun(App.state.searchbox, 'change:search', search)

    JobActions.checkPendingApprovals()
  },
  // renderPlusButton () {
  //   this.plusButton = new PlusMenuButton()
  //   this.renderSubview(this.plusButton)
  // },
  setSliderSizes () {
    slideCount = $('#slider ul li.tab-content').length
    slideWidth = $(window).width()
    sliderUlWidth = slideCount * slideWidth

    $('#slider ul.tab-contents').css({ width: sliderUlWidth })
    $('#slider ul.tab-contents li.tab-content').css({ width: slideWidth })

    if ($('.dashboard-tabs .dashboard-tab.monitors-tab').hasClass('active')) {
      $('#slider ul.tab-contents').css({ left: 0 })
    }
    if ($('.dashboard-tabs .dashboard-tab.tasks-tab').hasClass('active')) {
      $('#slider ul.tab-contents').css({ left: -slideWidth })
    }
    if ($('.dashboard-tabs .dashboard-tab.notifications-tab').hasClass('active')) {
      $('#slider ul.tab-contents').css({ left: -(slideWidth * 2) })
    }
  },
  setCurrentTab (event) {
    var tabName = event.target.dataset.hook.substr(5)
    DashboardActions.setCurrentTab(tabName)
  },
  showTab (tabName, newLeft) {
    var el = this.query(`.dashboard-tabs .dashboard-tab.${tabName}-tab`)
    if (el.classList.contains('active')) {
      return
    }
    this.queryAll('.dashboard-tabs .dashboard-tab').forEach(el => el.classList.remove('active'))
    el.classList.add('active')

    $(window).scrollTop(0)
    $('#slider ul.tab-contents').animate({
      left: newLeft
    }, 400, function () {
      if (tabName === 'notifications') { NotificationActions.markAllRead() }
    })
  },
  updateCounts () {
    const reducer = (acc, cur) => acc + (cur.read ? 0 : 1)
    this.unread = this.notifications.toJSON().reduce(reducer, 0)
    this.showBadge = this.unread !== 0
  }
})
