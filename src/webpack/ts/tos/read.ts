import $ from "jquery"

$(() => {
  $("#backButton").removeAttr("href").attr("hidden", "true")
  if (window.history.length > 1) {
    $("#backButton").removeAttr("hidden").click(() => {
      window.history.back()
    })
  }
})