import View from 'ampersand-view'
import FormView from 'ampersand-form-view'
import InputView from 'ampersand-input-view'
import AuthActions from 'actions/auth'

const LoginForm = FormView.extend({
  autoRender: true,
  initialize () {
    let prevLogin = {}
    if (window.localStorage.prevLogin) { prevLogin = JSON.parse(window.localStorage.prevLogin) }
    this.fields = [
      new InputView({
        placeholder: 'User or email',
        name: 'identifier',
        type: 'email',
        required: true,
        invalidClass: 'text-danger',
        validityClassSelector: '.control-label',
        autofocus: true,
        value: prevLogin.identifier || ''
      }),
      new InputView({
        type: 'password',
        placeholder: 'Password',
        name: 'password',
        required: true,
        invalidClass: 'text-danger',
        validityClassSelector: '.control-label',
        value: prevLogin.password || ''
      })
    ]
    FormView.prototype.initialize.apply(this, arguments)
  }
})

module.exports = View.extend({
  autoRender: true,
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
    }
  },
  render () {
    this.renderWithTemplate(this)

    this.loginForm = new LoginForm({})

    this.renderSubview(this.loginForm, this.queryByHook('login-form'))
  }
})
