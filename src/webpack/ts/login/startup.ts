import $ from "jquery"
import UIkit from "uikit"
import { promisify } from "util"
import { simpleEncrypt } from "../crypto"
import { enableRecaptcha, grecaptcha, i18n, isWebview, recaptchaSiteKey } from "../global"
import * as Utils from "../utils"

$(() => {
  if (window.history.length > 1) {
    $("#backButton").removeAttr("hidden")
  }
  if (isWebview) {
    $("#external").removeAttr("hidden")
  }

  $("#startupForm").submit(async form => {
    form.preventDefault()
    Utils.hideVirtualKeyboard()

    const name = <string>$("#nickname").val()
    const email = <string>$("#email").val()
    const password = <string>$("#password").val()
    const password2 = <string>$("#password-confirm").val()
    if (
      name.length === 0 || name.length > 20
    ) return Utils.showNotification(i18n.nicknameIncorrect, "warning")
    if (
      email.length === 0 || !Utils.checkMailFormat(email)
    ) return Utils.showNotification(i18n.mailIncorrect, "warning")
    if (
      password.length === 0 || password.length > 32 || !Utils.checkPasswordFormat(password)
    ) return Utils.showNotification(i18n.passwordIncorrect, "warning")
    if (password !== password2) return Utils.showNotification(i18n.passwordsNotMatch, "warning")
    Utils.protectPage()
    try {
      let recaptcha = ""
      if (enableRecaptcha === true) {
        await promisify(grecaptcha.ready)()
        recaptcha = await grecaptcha.execute(recaptchaSiteKey, { action: "startup" })
      }
      const response = await Utils.sendRequest("login/startUp", {
        name,
        email,
        recaptcha,
        password: simpleEncrypt(password)
      })

      $("#startupSuccess").html(Utils.formatString($("#startupSuccess").html(), {
        userId: response.user_id,
        mail: response.mail_success === true ? i18n.checkMail : ""
      }))
      UIkit.toggle("#startupForm", {
        target: "#startupForm, #startupSuccess",
        animation: "uk-animation-fade"
      }).toggle()
      Utils.resetCookieAuth()
    } catch {
      Utils.protectPage(true)
    }
  })
})