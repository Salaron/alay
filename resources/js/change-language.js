$(function () {
  $("#changeLanguage").on("click", function () {
    UIkit.modal("#languageSelect").toggle()
  })
  $("input[type=radio][name='language_radio']").change(function () {
    setCookie("language", $(this).val(), 10000)
    if (userId !== "0") {
      var params = {
        module: "settings",
        action: "changeLanguage",
        code: $(this).val(),
        timestamp: Math.floor(Date.now() / 1000)
      }
      $.when(sendRequest(params)).done(function (response) {
        if (response.error || response.maintenance) return
        sendNotification(
          "Success. This page will reload automatically.",
          "success"
        )
        setTimeout(function() {
          window.location.href = window.location.href
        }, 1000)
      })
    } else {
      sendNotification(
        "Success. This page will reload automatically.",
        "success"
      )
      setTimeout(function() {
        window.location.href = window.location.href
      }, 1000)
    }
  })
})