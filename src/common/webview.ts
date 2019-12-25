import { readFile, readFileSync } from "fs"
import Handlebars from "handlebars"
import moment from "moment"
import { promisify } from "util"
import RequestData from "../core/requestData"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"

interface WebViewTemplates {
  [templateName: string]: Handlebars.TemplateDelegate | undefined
}
const templates: WebViewTemplates = {}

export class WebView extends CommonModule {
  constructor(action: BaseAction) {
    super(action)
  }
  public Handlebars = Handlebars

  public static getTemplateSync(module: string, action: string): Handlebars.TemplateDelegate {
    let template = templates[`${module}-${action}`]
    if (!template || Config.server.debug_mode) {
      template = Handlebars.compile(readFileSync(`./webview/${module}/${action}.hbs`, "utf-8"))
      if (!Config.server.debug_mode) {
        templates[`${module}-${action}`] = template
      }
    }
    return template
  }

  public async getTemplate(module: string, action: string): Promise<Handlebars.TemplateDelegate> {
    return WebView.getTemplate(module, action)
  }
  public static async getTemplate(module: string, action: string): Promise<Handlebars.TemplateDelegate> {
    let template = templates[`${module}-${action}`]
    if (!template || Config.server.debug_mode) {
      template = Handlebars.compile(await promisify(readFile)(`./webview/${module}/${action}.hbs`, "utf-8"))
      if (!Config.server.debug_mode) {
        templates[`${module}-${action}`] = template
      }
    }
    return template
  }

  public async getLanguageModal() {
    const clTemplate = await this.getTemplate("modal", "changelanguage")

    let userLangCode = Config.i18n.defaultLanguage
    try {
      userLangCode = await this.action.i18n.getUserLocalizationCode(this.requestData)
    } catch { } // tslint:disable-line
    return clTemplate({
      languageList: Config.i18n.languages,
      currentLanguage: userLangCode
    })
  }

  public async compileBodyTemplate(template: Handlebars.TemplateDelegate, requestData: RequestData, values: any = {}) {
    let context = {
      ...(values),
      headers: JSON.stringify(requestData.getWebapiHeaders()),
      publicKey: JSON.stringify(Config.server.PUBLIC_KEY),
      external: requestData.requestFromBrowser,
      isAdmin: Config.server.admin_ids.includes(requestData.user_id || 0),
      userId: requestData.user_id,
      authToken: requestData.auth_token
    }

    const htmlTemplate = await WebView.getTemplate("header", "htmlHead")

    return htmlTemplate({
      body: template({
        ...context
      }),
      changeLanguageModal: await this.getLanguageModal(),
      ...context
    })
  }
}

// Handlebars Helpers
Handlebars.registerHelper("equal", function(this: any, a, b, options) {
  if (a == b) { return options.fn(this) }
  return options.inverse(this)
})

Handlebars.registerHelper("nl2br", (text) => {
  return new Handlebars.SafeString(text.replace(/(\r\n|\n|\r|\\n|\\r|\\r\\n)/gm, "<br>"))
})

Handlebars.registerHelper("momentFormat", (date, format) => {
  return new Handlebars.SafeString(moment(date).format(format))
})

Handlebars.registerHelper("notAvailable", (value) => {
  return new Handlebars.SafeString(!value ? "—" : value)
})

Handlebars.registerHelper("header", (pageName, context) => {
  const template = WebView.getTemplateSync("header", "header")
  context.i18n.pageName = pageName
  context.support = {
    mail: Config.mailer.supportMail,
    enabled: Config.mailer.supportMail.length > 0
  }
  return new Handlebars.SafeString(template(context))
})

Handlebars.registerHelper("headerWithLanguage", (pageName, context, upperCase) => {
  const template = WebView.getTemplateSync("header", "headerWithLanguage")
  context.i18n.pageName = pageName
  context.support = {
    mail: Config.mailer.supportMail,
    enabled: Config.mailer.supportMail.length > 0
  }
  context.upperCase = upperCase
  return new Handlebars.SafeString(template(context))
})

Handlebars.registerHelper("setChecked", (currentValue, value) => {
  if (!value && currentValue === 0) return new Handlebars.SafeString("checked")
  return new Handlebars.SafeString(currentValue == value ? "checked" : "")
})

Handlebars.registerHelper("numberWithSpaces", (value) => {
  if (!value) return new Handlebars.SafeString("0")
  const parts = value.toString().split(".")
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return new Handlebars.SafeString(parts.join("."))
})

Handlebars.registerHelper("ifcond", function(this: any, v1, operator, v2, options) {
  switch (operator) {
    case "==":
      return (v1 == v2) ? options.fn(this) : options.inverse(this)
    case "===":
      return (v1 === v2) ? options.fn(this) : options.inverse(this)
    case "!=":
      return (v1 != v2) ? options.fn(this) : options.inverse(this)
    case "!==":
      return (v1 !== v2) ? options.fn(this) : options.inverse(this)
    case "<":
      return (v1 < v2) ? options.fn(this) : options.inverse(this)
    case "<=":
      return (v1 <= v2) ? options.fn(this) : options.inverse(this)
    case ">":
      return (v1 > v2) ? options.fn(this) : options.inverse(this)
    case ">=":
      return (v1 >= v2) ? options.fn(this) : options.inverse(this)
    case "&&":
      return (v1 && v2) ? options.fn(this) : options.inverse(this)
    case "||":
      return (v1 || v2) ? options.fn(this) : options.inverse(this)
    default:
      return options.inverse(this)
  }
})
