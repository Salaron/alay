import $ from "jquery"
import UIkit from "uikit"
import { promisify } from "util"
import { simpleEncrypt } from "../crypto"
import { enableRecaptcha, grecaptcha, i18n, isWebview, recaptchaSiteKey } from "../global"
import { checkMailFormat, checkPasswordFormat, formatString, hideVirtualKeyboard, protectPage, sendRequest, showNotification } from "../utils"

$(() => {
  if (window.history.length > 1) {
    $("#backButton").removeAttr("hidden")
  }
  if (isWebview) {
    $("#external").removeAttr("hidden")
  }

  $("#startupForm").submit(async form => {
    form.preventDefault()
    hideVirtualKeyboard()

    const name = <string>$("#nickname").val()
    const email = <string>$("#email").val()
    const password =<string> $("#password").val()
    const password2 = <string>$("#password-confirm").val()
    if (
      name.length === 0 || name.length > 20
    ) return showNotification(i18n.nicknameIncorrect, "warning")
    if (
      email.length === 0 || !checkMailFormat(email)
    ) return showNotification(i18n.mailIncorrect, "warning")
    if (
      password.length === 0 || password.length > 32 || !checkPasswordFormat(password)
    ) return showNotification(i18n.passwordIncorrect, "warning")
    if (password !== password2) return showNotification(i18n.passwordsNotMatch, "warning")
    protectPage()
    try {
      let recaptcha = ""
      if (enableRecaptcha === true) {
        await promisify(grecaptcha.ready)()
        recaptcha = await grecaptcha.execute(recaptchaSiteKey, { action: "startup" })
      }
      const response = await sendRequest("login/startUp", {
        name,
        email,
        recaptcha,
        password: simpleEncrypt(password)
      })

      $("#startupSuccess").html(formatString($("#startupSuccess").html(), {
        userId: response.user_id,
        mail: response.mail_success === true ? i18n.checkMail : ""
      }))
      UIkit.toggle("#startupForm", {
        target: "#startupForm, #startupSuccess",
        animation: "uk-animation-fade"
      }).toggle()
    } catch {
      protectPage(true)
    }
  })
})