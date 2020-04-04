import $ from "jquery"
import UIkit from "uikit"
import { getExternalURL, parseQueryString } from "../utils"

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

  $("#loginForm").submit(form => {
    form.preventDefault()
    // do login
    console.log("login")
  })

  $("#confirmCodeForm").submit(form => {
    form.preventDefault()
    console.log("Confirm code")
  })

  $("#recoverForm").submit(form => {
    form.preventDefault()
  })
})

export function doLogin() {
  console.log("DO!")
}