// For some reason typings for uikit-icons is missing
// Also UIKit typings is outdated a *bit*
// So disable checking for this file since we don't have anything else here
// @ts-nocheck

import UIkit from "uikit"
import Icons from "uikit/dist/js/uikit-icons.js"

// Load UIkit icons
UIkit.use(Icons)

// Load all scripts
const context = require.context("./", true, /\.ts$/)
context.keys().forEach(context)
