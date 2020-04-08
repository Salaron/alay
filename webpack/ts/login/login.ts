import $ from "jquery"
import UIkit from "uikit"
import { promisify } from "util"
import { simpleEncrypt } from "../crypto"
import { enableRecaptcha, grecaptcha, i18n, isWebview, recaptchaSiteKey } from "../global"
import { getExternalURL, protectPage, parseQueryString, sendRequest, showNotification } from "../utils"

$(() => {
  if (window.history.length !== 1) {
    $("#backButton").removeAttr("hidden")
  }
  if (isWebview) {
    $("#external").removeAttr("hidden")
  }

  let defaultForm = "#loginForm"
  if (parseQueryString().recovery) {
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
    $("input").blur() // hide android keyboard
    const login = <string>$("#login").val()
    const password = <string>$("#password").val()
    // todo: sanity check

    protectPage(false)
    let recaptcha = ""
    if (enableRecaptcha === true) {
      await promisify(grecaptcha.ready)()
      recaptcha = await grecaptcha.execute(recaptchaSiteKey, { action: "login" })
    }
    try {
      await sendRequest("login/login", {
        recaptcha,
        login: simpleEncrypt(login),
        password: simpleEncrypt(password)
      })
      UIkit.toggle("#loginForm", {
        target: "#loginForm, #loginSuccess",
        animation: "uk-animation-fade"
      }).toggle()
    } catch {
      protectPage(true)
    }
  })

  $("#recoverForm").submit(async form => {
    form.preventDefault()
    $("input").blur()

    const mail = <string>$("#mail").val()
    protectPage(false)
    let recaptcha = ""
    if (enableRecaptcha === true) {
      await promisify(grecaptcha.ready)()
      recaptcha = await grecaptcha.execute(recaptchaSiteKey, { action: "passwordRecovery" })
    }

    try {
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
      // nothing
    } finally {
      protectPage(true)
    }
  })

  $("#codeVerifyForm").submit(async form => {
    form.preventDefault()
    $("input").blur()

    const code = <string>$("#verifyCode").val()
    if (code.length !== 10) return showNotification(i18n.confirmationCodeInvalidFormat, "warning")
    protectPage(false)
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
      // nothing to handle
    } finally {
      protectPage(true)
    }
  })
})
