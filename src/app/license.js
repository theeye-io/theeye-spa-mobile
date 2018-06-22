import App from 'ampersand-app'
import fetch from 'isomorphic-fetch'
import config from 'config'

const swallow = () => {
  App.state.session.licenseExpired = false
}

const showError = () => {
  App.state.alerts.danger('Error. Please try again later.')
}

module.exports = {
  checkLicense () {
    const customerName = App.state.session.customer.name
    const loggedIn = App.state.session.logged_in

    // when no session, no customer. Cancel check.
    if (!loggedIn || !customerName) return

    const licenseServiceUri = config.lc_url
    const url = `${licenseServiceUri}?client=${customerName}`

    const fetchOptions = {
      headers: new window.Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }),
      mode: 'cors'
    }
    return fetch(url, fetchOptions)
      .catch(err => swallow(err))
      .then(res => res.json())
      .then(json => {
        if (json && json.endLicense) {
          const expired = new Date() > new Date(json.endLicense)
          App.state.session.licenseExpired = expired
        } else {
          App.state.session.licenseExpired = false
        }
      })
      .catch(err => swallow(err))
  },
  setEnterprise (customerName) {
    if (!customerName) return

    const licenseServiceUri = config.lc_url
    const url = `${licenseServiceUri}?client=${customerName}`

    const fetchOptions = {
      headers: new window.Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }),
      mode: 'cors'
    }
    return fetch(url, fetchOptions)
      .catch(err => showError(err))
      .then(res => res.json())
      .then(json => {
        if (json && json.ip) {
          App.config.app_url = json.ip
          App.config.api_url = `${json.ip}/apiv2`
          App.config.api_v3_url = `${json.ip}/apiv3`
          App.config.socket_url = `${json.ip}:443`

          App.state.enterprise.toggle('showEnterpriseForm')
        } else {
          showError()
        }
      })
      .catch(err => showError(err))
  }
}
