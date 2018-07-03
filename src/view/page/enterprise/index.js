import View from 'ampersand-view'
import FormView from 'ampersand-form-view'
import InputView from 'ampersand-input-view'
import AuthActions from 'actions/auth'
import App from 'ampersand-app'
import {setConfigUris} from 'app/license'

const LoginForm = FormView.extend({
  autoRender: true,
  initialize () {
    this.fields = [
      new InputView({
        placeholder: 'User or email',
        name: 'identifier',
        required: true,
        invalidClass: 'text-danger',
        validityClassSelector: '.control-label',
        autofocus: true
      }),
      new InputView({
        type: 'password',
        placeholder: 'Password',
        name: 'password',
        required: true,
        invalidClass: 'text-danger',
        validityClassSelector: '.control-label'
      })
    ]
    FormView.prototype.initialize.apply(this, arguments)
  }
})

const EnterpriseForm = FormView.extend({
  autoRender: true,
  initialize () {
    this.fields = [
      new InputView({
        placeholder: 'Organization name',
        name: 'organization',
        required: true,
        invalidClass: 'text-danger',
        validityClassSelector: '.control-label',
        autofocus: true
      })
    ]
    FormView.prototype.initialize.apply(this, arguments)
  }
})

module.exports = View.extend({
  autoRender: true,
  props: {
    formSwitch: ['boolean',false,true]
  },
  bindings: {
    formSwitch: [
      {
        type: 'toggle',
        hook: 'login-form-container',
        invert: true
      },
      {
        type: 'toggle',
        hook: 'enterprise-form-container'
      }
    ]
  },
  template: require('./template.hbs'),
  events: {
    'click [data-hook=google-login-mobile]': function (event) {
      event.preventDefault()
      event.stopPropagation()
      AuthActions.socialLoginMobile('google')
    },
    'click button[data-hook=start-login]': function (event) {
      event.preventDefault()
      event.stopPropagation()
      this.loginForm.beforeSubmit()
      if (this.loginForm.valid) {
        var data = this.loginForm.data
        AuthActions.login(data)
      }
    },
    'click button[data-hook=start-enterprise]': function (event) {
      event.preventDefault()
      event.stopPropagation()
      this.enterpriseForm.beforeSubmit()
      if (this.enterpriseForm.valid) {
        var data = this.enterpriseForm.data
        setConfigUris(data.organization)
      }
    }
  },
  initialize () {
    this.formSwitch = App.state.enterprise.showEnterpriseForm = true
    this.listenTo(App.state.enterprise, 'change:showEnterpriseForm', () => {
      this.toggle('formSwitch')
    })
  },
  render () {
    this.renderWithTemplate(this)

    this.loginForm = new LoginForm({})
    this.renderSubview(this.loginForm, this.queryByHook('login-form'))

    this.enterpriseForm = new EnterpriseForm({})
    this.renderSubview(this.enterpriseForm, this.queryByHook('enterprise-form'))
  }
})
