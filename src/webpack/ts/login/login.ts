import $ from "jquery"
import UIkit from "uikit"
import { promisify } from "util"
import { simpleEncrypt } from "../crypto"
import { enableRecaptcha, grecaptcha, i18n, isWebview, recaptchaSiteKey } from "../global"
import * as Utils from "../utils"

$(() => {
  if (window.history.length > 0) {
    $("#backButton").removeAttr("hidden")
  }
  if (isWebview) {
    $("#external").removeAttr("hidden")
  }

  let defaultForm = "#loginForm"
  const params = Utils.parseQueryString()
  if (params.recovery) {
    defaultForm = "#codeVerifyForm"
    Utils.showNotification(i18n.mailSuccess, "success")
  }
  const toggle = UIkit.toggle(defaultForm, {
    target: defaultForm,
    animation: "uk-animation-fade"
  })
  toggle.toggle()

  // @ts-ignore $destroy method fully deactivate component
  toggle.$destroy()

  $("#loginForm").submit(async form => {
    form.preventDefault()
    Utils.hideVirtualKeyboard()
    const login = <string>$("#login").val()
    const password = <string>$("#password").val()
    // todo: sanity check

    Utils.protectPage()
    try {
      let recaptcha = ""
      if (enableRecaptcha === true) {
        await promisify(grecaptcha.ready)()
        recaptcha = await grecaptcha.execute(recaptchaSiteKey, { action: "login" })
      }
      let type = isNaN(parseInt(params.type)) ? undefined : parseInt(params.type)
      const response = await Utils.sendRequest("login/login", {
        recaptcha,
        login: simpleEncrypt(login),
        password: simpleEncrypt(password),
        type
      })
      if (response.redirect) {
        location.replace(response.redirect)
      } else {
        UIkit.toggle("#loginForm", {
          target: "#loginForm, #loginSuccess",
          animation: "uk-animation-fade"
        }).toggle()
      }
    } catch {
      Utils.protectPage(true)
    }
  })

  $("#recoverForm").submit(async form => {
    form.preventDefault()
    Utils.hideVirtualKeyboard()

    const mail = <string>$("#mail").val()
    // additional checks

    Utils.protectPage()
    try {
      let recaptcha = ""
      if (enableRecaptcha === true) {
        await promisify(grecaptcha.ready)()
        recaptcha = await grecaptcha.execute(recaptchaSiteKey, { action: "passwordRecovery" })
      }
      await Utils.sendRequest("login/passwordRecovery", {
        mail,
        recaptcha
      })
      if (isWebview) {
        location.replace(Utils.getExternalURL(location.href + "?recovery=1"))
      } else {
        const toggle = UIkit.toggle("#recoverForm", {
          target: "#recoverForm, #codeVerifyForm",
          animation: "uk-animation-fade"
        })
        toggle.toggle()
        // @ts-ignore
        toggle.$destroy()
        Utils.showNotification(i18n.mailSuccess, "success")
      }
    } catch {
      // ignore
    } finally {
      Utils.protectPage(true)
    }
  })

  $("#codeVerifyForm").submit(async form => {
    form.preventDefault()
    Utils.hideVirtualKeyboard()

    const code = <string>$("#verifyCode").val()
    if (code.length !== 10) return Utils.showNotification(i18n.confirmationCodeInvalidFormat, "warning")

    Utils.protectPage()
    try {
      await Utils.sendRequest("login/codeVerify", { code })
      const toggle = UIkit.toggle("#codeVerifyForm", {
        target: "#codeVerifyForm, #loginForm",
        animation: "uk-animation-fade"
      })
      toggle.toggle()
      // @ts-ignore
      toggle.$destroy()
      $("#verifyCode").val("")
      Utils.showNotification(i18n.passwordResetSuccess, "success")
    } catch {
      // ignore
    } finally {
      Utils.protectPage(true)
    }
  })
})
