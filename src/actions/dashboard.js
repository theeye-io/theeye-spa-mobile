import search from 'lib/query-params'
import App from 'ampersand-app'
import after from 'lodash/after'
import WorkflowActions from 'actions/workflow'
import ApprovalActions from 'actions/approval'

module.exports = {
  setMonitorsGroupByProperty (prop) {
    const query = search.get()
    query.monitorsgroupby = { prop: prop }
    const qs = search.set(query)

    App.Router.navigate(`dashboard?${qs}`, { replace: true })
    App.Router.reload()
  },
  loadNewRegisteredHostAgent (host) {
    var done = after(2, function () {
      App.state.dashboard.groupResources()
    })
    var step = function () {
      done()
    }
    App.state.resources.fetch({ success: step, error: step })
    App.state.hosts.fetch({ success: step, error: step })
  },
  setCurrentTab (tabName) {
    App.state.dashboard.currentTab = tabName
  },
  fetchData (options) {
    const { fetchTasks, fetchNotifications } = options

    var resourcesToFetch = 7
    if (fetchTasks) resourcesToFetch += 2
    if (fetchNotifications) resourcesToFetch += 1
    var done = after(resourcesToFetch, () => {
      App.state.loader.visible = false
    })

    const step = () => {
      // App.state.loader.step()
      done()
    }

    if (fetchTasks) {
      const nextStep = () => {
        step()
        App.state.tasks.fetch({
          success: () => {
            App.state.dashboard.groupTasks()
            App.state.workflows.forEach(workflow => {
              WorkflowActions.populate(workflow)
            })

            ApprovalActions.check()
            step()
          },
          error: step,
          reset: true
        })
      }
      App.state.workflows.fetch({ success: nextStep, error: nextStep })
    }

    if (fetchNotifications) {
      App.state.notifications.fetch({ reset: true })
    }

    App.state.events.fetch({ success: step, error: step })
    // App.state.scripts.fetch({ success: step, error: step })
    App.state.files.fetch({ success: step, error: step })
    App.state.hosts.fetch({ success: step, error: step })
    App.state.tags.fetch({ success: step, error: step })
    App.state.members.fetch({ success: step, error: step })
    App.state.indicators.fetch({ success: step, error: step })
    App.state.resources.fetch({
      success: () => {
        App.state.dashboard.groupResources()
        step()
      },
      error: step,
      reset: true
    })
  }
}
