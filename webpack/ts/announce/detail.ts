import $ from "jquery"
import { isWebview } from "../global"
import { getExternalURL } from "../utils"

$(() => {
  if (window.history.length !== 1) {
    $("#backButton").removeAttr("hidden")
  }
  if (!isWebview) {
    $('a[href^="http"]').each(function () {
      if (typeof $(this).attr("href") !== "string") return
      if ($(this).attr("href")!.includes("webview.php/announce/index")) return
      $(this).attr("href", getExternalURL($(this).attr("href")))
    })
  }
})