import Handlebars from "handlebars"
import moment from "moment"
import { promisify } from "util"
import { readFile, readFileSync } from "fs"
import { Connection } from "../core/database_wrappers/mysql"
import { I18n } from "./i18n"

interface WebViewTemplates {
  [templateName: string]: Handlebars.TemplateDelegate | undefined
}
const templates: WebViewTemplates = {}

export class WebView {
  public Handlebars = Handlebars
  public connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
  }

  public static getTemplateSync(module: string, action: string): Handlebars.TemplateDelegate {
    let template = templates[`${module}-${action}`]
    if (!template || Config.server.debug_mode) {
      template = Handlebars.compile(readFileSync(`${rootDir}/webview/${module}/${action}.hbs`, "utf-8"))
      if (!Config.server.debug_mode) {
        templates[`${module}-${action}`] = template
      }
    }
    return template
  }
  public static async getTemplate(module: string, action: string): Promise<Handlebars.TemplateDelegate> {
    let template = templates[`${module}-${action}`]
    if (!template || Config.server.debug_mode) {
      template = Handlebars.compile(await promisify(readFile)(`${rootDir}/webview/${module}/${action}.hbs`, "utf-8"))
      if (!Config.server.debug_mode) {
        templates[`${module}-${action}`] = template
      }
    }
    return template
  }

  public async getCurrentOnline(): Promise<number> {
    return (await this.connection.first("SELECT COUNT(*) as cnt FROM user_login WHERE last_activity > :now", {
      now: moment().subtract(10, "minutes").format("YYYY-MM-DD HH:mm:ss")
    })).cnt
  }

  /**
   * @param {number | string} input - User Id, token or Language code
   */
  public async getLanguageModalTemplate(input?: number | string): Promise<string> {
    const template = await WebView.getTemplate("common", "changelanguage")
    const i18n = new I18n(this.connection)

    let languageCode = Config.i18n.defaultLanguage
    if (Type.isInt(input) || typeof input === "string" && input.match(/^[a-z0-9]{70,90}$/gi)) {
      // token or user id
      languageCode = await i18n.getUserLocalizationCode(input)
    } else if (typeof input === "string") languageCode = input

    return template({
      languageList: Config.i18n.languages,
      currentLanguage: languageCode
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
  const template = WebView.getTemplateSync("common", "header")
  context.i18n.pageName = pageName
  context.support = {
    mail: Config.mailer.supportMail,
    enabled: Config.mailer.supportMail.length > 0
  }
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
