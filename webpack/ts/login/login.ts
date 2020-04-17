import $ from "jquery"
import UIkit from "uikit"
import { promisify } from "util"
import { simpleEncrypt } from "../crypto"
import { enableRecaptcha, grecaptcha, i18n, isWebview, recaptchaSiteKey } from "../global"
import { getExternalURL, hideVirtualKeyboard, parseQueryString, protectPage, sendRequest, showNotification } from "../utils"

$(() => {
  if (window.history.length > 0) {
    $("#backButton").removeAttr("hidden")
  }
  if (isWebview) {
    $("#external").removeAttr("hidden")
  }

  let defaultForm = "#loginForm"
  const params = parseQueryString()
  if (params.recovery) {
    defaultForm = "#codeVerifyForm"
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
    hideVirtualKeyboard()
    const login = <string>$("#login").val()
    const password = <string>$("#password").val()
    // todo: sanity check

    protectPage()
    try {
      let recaptcha = ""
      if (enableRecaptcha === true) {
        await promisify(grecaptcha.ready)()
        recaptcha = await grecaptcha.execute(recaptchaSiteKey, { action: "login" })
      }
      let type = isNaN(parseInt(params.type)) ? undefined : parseInt(params.type)
      const response = await sendRequest("login/login", {
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
      protectPage(true)
    }
  })

  $("#recoverForm").submit(async form => {
    form.preventDefault()
    hideVirtualKeyboard()

    const mail = <string>$("#mail").val()
    // additional checks

    protectPage()
    try {
      let recaptcha = ""
      if (enableRecaptcha === true) {
        await promisify(grecaptcha.ready)()
        recaptcha = await grecaptcha.execute(recaptchaSiteKey, { action: "passwordRecovery" })
      }
      await sendRequest("login/passwordRecovery", {
        mail,
        recaptcha
      })
      if (isWebview) {
        location.replace(getExternalURL() + "&recovery=1")
      } else {
        const toggle = UIkit.toggle("#recoverForm", {
          target: "#recoverForm, #codeVerifyForm",
          animation: "uk-animation-fade"
        })
        toggle.toggle()
        // @ts-ignore
        toggle.$destroy()
        showNotification(i18n.mailSuccess, "success")
      }
    } catch {
      // ignore
    } finally {
      protectPage(true)
    }
  })

  $("#codeVerifyForm").submit(async form => {
    form.preventDefault()
    hideVirtualKeyboard()

    const code = <string>$("#verifyCode").val()
    if (code.length !== 10) return showNotification(i18n.confirmationCodeInvalidFormat, "warning")

    protectPage()
    try {
      await sendRequest("login/codeVerify", { code })
      const toggle = UIkit.toggle("#codeVerifyForm", {
        target: "#codeVerifyForm, #loginForm",
        animation: "uk-animation-fade"
      })
      toggle.toggle()
      // @ts-ignore
      toggle.$destroy()
      $("#verifyCode").val("")
      showNotification(i18n.passwordResetSuccess, "success")
    } catch {
      // ignore
    } finally {
      protectPage(true)
    }
  })
})
