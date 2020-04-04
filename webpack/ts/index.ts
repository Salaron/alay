// For some reason typings for uikit-icons is missing
// Also UIKit typings is outdated a *bit*

import UIkit from "uikit"
// @ts-ignore
import Icons from "uikit/dist/js/uikit-icons.js"

// Load UIkit icons
// @ts-ignore
UIkit.use(Icons)

// Load all scripts
const context = require.context("./", true, /\.ts$/)
context.keys().forEach(context)

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