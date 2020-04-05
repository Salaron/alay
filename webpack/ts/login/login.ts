import $ from "jquery"
import UIkit from "uikit"
import { promisify } from "util"
import { simpleEncrypt } from "../crypto"
import { enableRecaptcha, grecaptcha, recaptchaSiteKey } from "../global"
import { parseQueryString, sendRequest } from "../utils"

$(() => {
  if (window.history.length !== 1) {
    $("#backButton").removeAttr("hidden")
  }

  let defaultForm = "#loginForm"
  if (parseQueryString().recovery) {
    defaultForm = "#confirmCodeForm"
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
      // handle errors?
    } finally {
      // enable buttons
    }
  })

  $("#confirmCodeForm").submit(form => {
    form.preventDefault()
    console.log("Confirm code")
  })

  $("#recoverForm").submit(form => {
    form.preventDefault()
  })
})
