import App from 'ampersand-app'
import View from 'ampersand-view'
import SearchActions from 'actions/searchbox'
import ExecTaskButton from '../task-exec-button'
// import TaskIntegrationButton from 'view/page/task/buttons/integrations'
// import EditTaskButton from 'view/page/task/buttons/edit'
// import CopyTaskButton from 'view/page/task/buttons/copy'
// import DeleteTaskButton from 'view/page/task/buttons/delete'
import CollapsibleRow from 'view/page/dashboard/task/collapsible-row'
import Schedules from 'view/page/task/schedules'
import Acls from 'lib/acls'
import $ from 'jquery'
import JobRow from './job'
import JobsList from 'view/page/dashboard/task/jobs-list'

module.exports = CollapsibleRow.extend({
  onClickToggleCollapse (event) {
    App.actions.task.populate(this.model)
    return
  },
  renderButtons () {
    this.renderSubview(
      new TaskButtonsView({ model: this.model }),
      this.query('ul.dropdown-menu[data-hook=buttons-container]')
    )

    if (Acls.hasAccessLevel('user')) {
      const button = this.renderSubview(
        new ExecTaskButton({ model: this.model }),
        this.queryByHook('execute-button-container')
      )
    }

  },
  renderCollapsedContent () {
    this.renderSubview(
      new Schedules({model: this.model}),
      this.queryByHook('collapse-container-body'),
    )

    this.renderSubview(
      new JobsList({ model: this.model, rowView: JobRow }),
      this.queryByHook('collapse-container-body'),
    )
  }
})

const TaskButtonsView = View.extend({
  template: `
    <div>
      <li>
        <button data-hook="search" class="btn btn-primary tooltiped" title="Search related elements">
          <i class="fa fa-search" aria-hidden="true"></i>
        </button>
      </li>
      <span data-hook="integration-button"> </span>
    </div>
  `,
  events: {
    'click button[data-hook=search]':'onClickSearch',
    // 'click button[data-hook=workflow]':'onClickWorkflow',
    // 'click button[data-hook=recipe]':'onClickRecipe',
  },
  // onClickRecipe (event) {
  //   event.stopPropagation()
  //   event.preventDefault()
  //   $('.dropdown.open .dropdown-toggle').dropdown('toggle')
  //   App.actions.task.exportRecipe(this.model.id)
  //   return false
  // },
  // onClickWorkflow (event) {
  //   event.stopPropagation()
  //   event.preventDefault()
  //   $('.dropdown.open .dropdown-toggle').dropdown('toggle')
  //   App.actions.task.nodeWorkflow(this.model.id)
  //   return false
  // },
  onClickSearch (event) {
    event.preventDefault()
    event.stopPropagation()
    $('.dropdown.open .dropdown-toggle').dropdown('toggle')
    SearchActions.search(this.model.name)
    return false
  },
  render () {
    this.renderWithTemplate(this)

    // if (Acls.hasAccessLevel('admin')) {
    //   var editButton = new EditTaskButton({ model: this.model })
    //   this.renderSubview(editButton, this.queryByHook('edit-button'))
    //
    // var integrationButton = new TaskIntegrationButton({ model: this.model })
    // this.renderSubview(integrationButton, this.queryByHook('integration-button'))
    //
    //   var copyButton = new CopyTaskButton({ model: this.model })
    //   this.renderSubview(copyButton, this.queryByHook('copy-button'))
    //
    //   var deleteButton = new DeleteTaskButton({ model: this.model })
    //   this.renderSubview(deleteButton, this.queryByHook('delete-button'))
    // }
  }
})
