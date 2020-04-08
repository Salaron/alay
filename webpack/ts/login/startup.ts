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
    // is it ok to validate like that?
    if (name.length === 0) return showNotification(i18n.nicknameBlank, "warning")
    if (name.length > 20) return showNotification(i18n.nicknameLimit, "warning")
    if (email.length === 0) return showNotification(i18n.mailBlank, "warning")
    if (!checkMailFormat(email)) return showNotification(i18n.mailInvalidFormat, "warning")
    if (password.length === 0) return showNotification(i18n.passwordBlank, "warning")
    if (password.length > 32) return showNotification(i18n.passwordLimit, "warning")
    if (!checkPasswordFormat(password)) return showNotification(i18n.passwordInvalidFormat, "warning")
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