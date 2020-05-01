import $ from "jquery"
import UIkit from "uikit"
import { simpleEncrypt } from "../crypto"
import { i18n, user } from "../global"
import { checkMailFormat, checkPasswordFormat, formatString, sendRequest, showNotification } from "../utils"

$(() => {
  $("#accountSettingsForm").submit(async form => {
    form.preventDefault()

    const nickname = $("#nickname").val()
    const email = $("#email").val()
    const currentPassword = $("#currentPassword").val()
    const newPassword = $("#newPassword").val()
    const newPassword2 = $("#newPassword2").val()
    if (nickname !== user.name) {
      if (
        typeof nickname !== "string" || nickname.length === 0 || nickname.length > 20
      ) {
        showNotification(i18n.nicknameIncorrect, "warning")
      } else {
        try {
          await sendRequest("settings/changeName", {
            nickname
          })
          showNotification(i18n.nicknameChanged, "success")
          user.name = <string>nickname
        } catch {
          //
        }
      }
    }
    if (email !== "" && email !== user.mail) {
      if (!checkMailFormat(<string>email)) {
        showNotification(i18n.mailIncorrect, "warning")
      } else {
        try {
          await sendRequest("settings/changeMail", {
            mail: email
          })
          showNotification(i18n.emailChanged, "success")
          user.mail = <string>email
        } catch {
          //
        }
      }
    }

    if (currentPassword !== "" && newPassword !== "" && newPassword2 !== "") {
      if (
        !checkPasswordFormat(<string>currentPassword) ||
        !checkPasswordFormat(<string>newPassword)
      ) {
        showNotification(i18n.passwordIncorrect, "warning")
      } else if (newPassword !== newPassword2) {
        showNotification(i18n.passwordsNotMatch, "warning")
      } else {
        try {
          await sendRequest("settings/changePassword", {
            password: simpleEncrypt(<string>currentPassword),
            newPassword: simpleEncrypt(<string>newPassword)
          })
          $("#currentPassword").val("")
          $("#newPassword").val("")
          $("#newPassword2").val("")
          showNotification(i18n.passwordChanged, "success")
        } catch {
          //
        }
      }
    }
  })

  $("#bulkDeleteForm").submit(async form => {
    form.preventDefault()

    const password = <string>$("#confirmationPassword").val()
    if (!checkPasswordFormat(password)) return showNotification(i18n.passwordIncorrect, "warning")

    const response = await sendRequest("settings/bulkDelete", {
      password: simpleEncrypt(password),
      rarity: parseInt(<string>$("input[name=bulkDelete]:checked").val())
    })
    UIkit.modal("#bulkDeleteModal").hide()
    $("#confirmationPassword").val()
  })

  $(".settings-radio").change(async function () {
    await sendRequest("settings/set", {
      // @ts-ignore
      name: this.name,
      value: parseInt(<string>$(this).val())
    })
  })

  $(".bulkDelete-radio").change(function () {
    const rarityMap = {
      "1": "N",
      "2": "R",
      "3": "SR",
      "4": "UR",
      "5": "SSR"
    }
    const notice = formatString("Вы собираетесь удалить карты редкости \{{rarity\}}. Это действие невозможно отменить!", {
      rarity: rarityMap[<"1" | "2" | "3" | "4" | "5">$(this).val()]
    })
    $("#deleteNotice").text(notice)
    $("#bulkDeleteButton").prop("disabled", false)
  })
})