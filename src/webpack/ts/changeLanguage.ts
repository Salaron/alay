import $ from "jquery"
import UIkit from "uikit"
import { userId } from "./global"
import { setCookie, showNotification, sendRequest } from "./utils"

$(() => {
  $("#changeLanguageButton").on("click", () => {
    UIkit.modal("#changeLanguageModal").show()
  })
  $("input[type=radio][name='language_radio']").change(async function() {
    const langCode = <string>$(this).val()
    setCookie("language", langCode, 100)
    if (userId !== 0) {
      // send request to server
      await sendRequest("settings/changeLanguage", {
        code: langCode
      })
    }

    showNotification("Success. This page will reload automatically.", "success")
    setTimeout(() => {
      window.location.href = window.location.href
    }, 700)
  })
})