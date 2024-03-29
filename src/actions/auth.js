'use strict'

import App from 'ampersand-app'
import XHR from 'lib/xhr'
import bootbox from 'bootbox'
import credentials from 'config/credentials'
import AnalyticsActions from './analytics'
const xhr = $.ajax

const persistOnStorage = function (data) {
  window.localStorage.setItem('prevLogin', JSON.stringify(data))
}

module.exports = {
  login (data) {
    App.state.loader.visible = true
    XHR.send({
      url: `${App.config.app_url}/auth/login`,
      method: 'post',
      jsonData: data,
      timeout: 5000,
      withCredentials: true,
      headers: {
        Accept: 'application/json;charset=UTF-8'
      },
      done: (response, xhr) => {
        persistOnStorage(data)
        App.state.loader.visible = false
        if (xhr.status == 200){
          AnalyticsActions.trackEvent('Auth', 'Login')
          AnalyticsActions.trackMixpanelEvent('login', {provider: 'Local'})
          App.state.session.set({
            access_token: response.access_token
          })
        } else {
          bootbox.alert('Login error, please try again')
        }
      },
      fail: (err,xhr) => {
        App.state.loader.visible = false
        if (xhr.status == 400) {
          bootbox.alert('Login error, invalid credentials')
        } else {
          bootbox.alert('Login error, please try again')
        }
      }
    })
  },
  logout () {
    XHR.send({
      url: `${App.config.app_url}/logout`,
      method: 'get',
      timeout: 5000,
      withCredentials: true,
      headers: {
        Accept: 'application/json;charset=UTF-8'
      },
      done: (response,xhr) => {
        if (xhr.status == 200) {
          AnalyticsActions.unsetMixpanelUser()
        }
      },
      fail: (err,xhr) => {
        AnalyticsActions.trackError(err, 'Logout Error')
        //bootbox.alert('Something goes wrong.')
      }
    })

    AnalyticsActions.trackEvent('Auth', 'Logout')
    AnalyticsActions.trackMixpanelEvent('logout')
    if(window.plugins && window.plugins.googleplus) {
      window.plugins.googleplus.disconnect(function (msg) {console.log(msg)})
    }

    App.state.reset() // reset all application states
    App.state.session.clear() // force session destroy on client
    App.state.alerts.success('Logged Out.','See you soon')
  },
  resetMail (data) {
    App.state.loader.visible = true
    XHR.send({
      url: `${App.config.app_url}/password/resetmail`,
      method: 'post',
      jsonData: data,
      timeout: 5000,
      withCredentials: true,
      headers: {
        Accept: 'application/json;charset=UTF-8'
      },
      done: (response,xhr) => {
        App.state.loader.visible = false
        if (xhr.status == 200){
          bootbox.alert({
            message: 'Password reset link sent',
            callback: () => {
              App.state.login.showRecoverForm = !App.state.login.showRecoverForm
           }
          })
        } else {
            bootbox.alert('Error, please try again')
        }
      },
      fail: (err,xhr) => {
        App.state.loader.visible = false
        if (xhr.status == 400) {
          bootbox.alert('User email not found')
        } else {
          AnalyticsActions.trackError(err, 'Login Error')
          bootbox.alert('Error, please try again')
        }
      }
    })
  },
  register (data) {
    App.state.loader.visible = true

    var body = {}
    body.email = data.email
    body.username = data.email
    body.name = data.name
    body.grecaptcha = data.grecaptcha

    const req = xhr({
      url: `${App.config.app_url}/registeruser`,
      type: 'POST',
      data: JSON.stringify(body),
      dataType: 'json',
      contentType: 'application/json; charset=utf-8',
    })

    req.done(function(){
      App.state.loader.visible = false
      App.state.register.result = true
    })
    req.fail(function(jqXHR, textStatus, errorThrown){
      App.state.loader.visible = false
      var msg = jqXHR.responseText || 'An error has ocurred, please try again later.'
      bootbox.alert({
        title: 'Registration error',
        message: msg
      })
    })
  },
  checkUsernameActivation (username, token) {
    XHR.send({
      url: `${App.config.app_url}/checkusernameactivation?token=` + encodeURIComponent(token) + '&username=' + encodeURIComponent(username),
      method: 'get',
      done: (response,xhr) => {
        if (xhr.status !== 201) {
          bootbox.alert('Account activation error, please try again later.')
          App.state.activate.finalStep = false
        } else {
          App.state.activate.username = username
          App.state.activate.finalStep = true
        }
      },
      fail: (err,xhr) => {
        if (xhr.status == 400) {
          bootbox.alert('Username already in use.')
          App.state.activate.finalStep = false
        } else if (xhr.status !== 201) {
          bootbox.alert('Account activation error, please try again later.')
          App.state.activate.finalStep = false
        }
      }
    })
  },
  activateStep (data, token) {
    App.state.loader.visible = true
    var token = encodeURIComponent(token);

    XHR.send({
      url: `${App.config.app_url}/auth/activateuser?token=${token}`,
      method: 'post',
      jsonData: data,
      timeout: 5000,
      headers: {
        Accept: 'application/json;charset=UTF-8'
      },
      done (response,xhr) {
        App.state.loader.visible = false
        if (xhr.status == 200) {
          bootbox.alert({
            message: 'Registration is completed',
            callback: () => {
              App.state.session.set({
                access_token: response.access_token
              })
              // App.navigate('dashboard')
            }
          })
        } else {
          bootbox.alert({
            message: 'Error, please try again',
            callback: () => {
            }
          })
        }
      },
      fail (err,xhr) {
        App.state.loader.visible = false
        if (xhr.status == 400) {
          bootbox.alert({
            message: xhr.response.body.error || 'Error, please try again',
            callback: () => {
            }
          })
        } else {
          bootbox.alert({
            message: 'Error, please try again',
            callback: () => {
            }
          })
        }
      }
    })
  },
  toggleLoginForm() {
    App.state.login.toggle('showRecoverForm')
  },
  providerLogin(provider) {
    window.location.replace('auth/'+provider)
  },
  socialLoginMobile(provider) {
    if(provider == 'googlemobile') {
      window.plugins.googleplus.login({
        'webClientId': credentials.google.webClientId,
        'offline': true
      },
      function(userData) {
        XHR.send({
          url: `${App.config.app_url}/api/auth/social/${provider}/verifytoken`,
          method: 'post',
          jsonData: {email: userData.email, idToken: userData.idToken},
          headers: {
            Accept: 'application/json;charset=UTF-8'
          },
          done: (response,xhr) => {
            if (xhr.status == 200){
              AnalyticsActions.trackEvent('Auth', 'Social Login', 'Google')
              AnalyticsActions.trackMixpanelEvent('login', {provider: 'Google'})

              App.state.session.set({
                access_token: response.access_token
              })
            } else {
              if (xhr.status == 400) {
                bootbox.alert('Login error, invalid credentials')
              } else {
                bootbox.alert('Login error, please try again')
              }
            }
          },
          fail: (err,xhr) => {
            window.plugins.googleplus.disconnect(
              function (msg) {
                App.state.session.destroy()
                App.state.alerts.success('Logged Out.','See you soon')
              }
            );
            if (xhr.status == 400) {
              bootbox.alert('Login error, invalid credentials')
            } else {
              AnalyticsActions.trackError(err, 'Social Login (google) Error')
              bootbox.alert('Login error, please try again')
            }
          }
        })
      },
      function(error){
        //throws error ==12501 on modal close event
        if (error!==12501) {
          AnalyticsActions.trackError(error, 'Social Login (google) Error')

          bootbox.alert('Login error, please try again')
        }
      })
    }
  }
}
