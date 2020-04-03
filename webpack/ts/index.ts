import UIkit from "uikit"

// Load all scripts
const context = require.context("./", true, /\.ts$/)
context.keys().forEach(context)
