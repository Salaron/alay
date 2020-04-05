// For some reason typings for uikit-icons is missing
// Also UIKit typings is outdated a *bit*

import UIkit from "uikit"
// @ts-ignore
import Icons from "uikit/dist/js/uikit-icons.js"

// Load UIkit icons
// @ts-ignore
UIkit.use(Icons)

// Load base scripts
const context = require.context("./", false, /\.ts$/)
context.keys().forEach(context)

// Attempt to load page script
try {
  const urlSplit = location.pathname.split("/")
  require(`./${urlSplit[2]}/${urlSplit[3]}`) // tslint:disable-line
} catch { } // tslint:disable-line

// Do init stuff
import { isWebview } from "./global"
import { getExternalURL } from "./utils"
import $ from "jquery"

if (isWebview) {
  $("#external").attr("href", getExternalURL())
  $(".external-link").each(function () {
    $(this).attr("href", "native://browser?url=" + encodeURIComponent(<string>$(this).attr("href")))
  })
}
