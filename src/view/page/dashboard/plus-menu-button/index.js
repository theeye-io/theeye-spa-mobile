import App from 'ampersand-app'
import View from 'ampersand-view'
import TaskCreationWizard from 'view/page/task/creation-wizard'
import MonitorCreationWizard from 'view/page/monitor/creation-wizard'
import WorkflowCreationWizard from 'view/page/workflow/creation-wizard'
import IndicatorCreationWizard from 'view/page/indicator/creation-wizard'

import './style.less'

module.exports = View.extend({
  props: {
    hidden: ['boolean', false, true]
  },
  template: `
    <div class="plus-button-component">
      <div data-hook="menu-options-container" class="menu"></div>
      <div class="menu-button" data-hook="menu-toggle">
        <span class="fa fa-plus"></span>
      </div>
    </div>
  `,
  events: {
    'click [data-hook=menu-toggle]': 'onMenuToggle'
  },
  onMenuToggle (event) {
    this.toggle('hidden')
  },
  render () {
    this.renderWithTemplate(this)
    this.on('change:hidden', this.toggleMenuOptions)

    this.renderOptions()
  },
  toggleMenuOptions () {
    let elems = this.queryAll('.menu-option')
    if (this.hidden===true) {
      elems.forEach( elem => elem.classList.add('hidden') )
    } else {
      elems.forEach( elem => elem.classList.remove('hidden') )
    }
  },
  renderOptions () {
    let menuOptionsContainer = this.queryByHook('menu-options-container')

    this.renderSubview(
      new TasksOptionsView(),
      menuOptionsContainer
    )

    this.renderSubview(
      new MonitorsOptionsView(),
      menuOptionsContainer
    )

    this.renderSubview(
      new WorkflowOptionsView(),
      menuOptionsContainer
    )

    this.renderSubview(
      new IndicatorsOptionsView(),
      menuOptionsContainer
    )
  }
})

const OptionView = View.extend({
  props: {
    icon: ['array', false, () => { return [] }],
    tip: 'string'
  },
  bindings: {
    icon: {
      type: 'class',
      hook: 'icon'
    },
    tip: { // this.el
      type: 'attribute',
      name: 'title'
    }
  },
  template: `
    <div class="menu-option hidden">
      <span data-hook="icon"></span>
    </div>
  `,
  render () {
    this.renderWithTemplate()
    this.renderTip()
  },
  renderTip () {
    $( this.el ).tooltip({
      placement: 'left',
      trigger: 'hover'
    })
  }
})

const IndicatorsOptionsView = OptionView.extend({
  initialize () {
    OptionView.prototype.initialize.apply(this,arguments)
    this.icon = ['fa','fa-lightbulb-o']
    this.tip = 'Create Indicator'
  },
  events: {
    'click':'create'
  },
  create (event) {
    event.preventDefault()
    let wizard = new IndicatorCreationWizard()
  }
})

const TasksOptionsView = OptionView.extend({
  initialize () {
    OptionView.prototype.initialize.apply(this,arguments)
    this.icon = ['fa','fa-play']
    this.tip = 'Create Task'
  },
  events: {
    'click':'startCreateWizard'
  },
  startCreateWizard (event) {
    event.preventDefault()
    let wizard = new TaskCreationWizard()
  }
})

const MonitorsOptionsView = OptionView.extend({
  initialize () {
    OptionView.prototype.initialize.apply(this,arguments)
    this.icon = ['fa','fa-desktop']
    this.tip = 'Create Monitor'
  },
  events: {
    'click':'startCreateWizard'
  },
  startCreateWizard (event) {
    event.preventDefault()
    let wizard = new MonitorCreationWizard()
  }
})

const WorkflowOptionsView = OptionView.extend({
  initialize () {
    OptionView.prototype.initialize.apply(this,arguments)
    this.icon = ['fa','fa-sitemap']
    this.tip = 'Create Workflow'
  },
  events: {
    'click':'startCreateWizard'
  },
  startCreateWizard (event) {
    event.preventDefault()
    let wizard = new WorkflowCreationWizard()
  }
})
