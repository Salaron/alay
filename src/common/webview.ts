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
      template = Handlebars.compile(readFileSync(`${rootDir}/webview/${module}/${action}.html`, "utf-8"))
      if (!Config.server.debug_mode) {
        templates[`${module}-${action}`] = template
      }
    }
    return template
  }
  public static async getTemplate(module: string, action: string): Promise<Handlebars.TemplateDelegate> {
    let template = templates[`${module}-${action}`]
    if (!template || Config.server.debug_mode) {
      template = Handlebars.compile(await promisify(readFile)(`${rootDir}/webview/${module}/${action}.html`, "utf-8"))
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

  public async getLanguageModalTemplate(userId: number): Promise<string>
  public async getLanguageModalTemplate(token: string): Promise<string>
  public async getLanguageModalTemplate(languageCode: string): Promise<string>
  public async getLanguageModalTemplate(input?: number | string): Promise<string> {
    const template = await WebView.getTemplate("common", "changelanguage")
    const i18n = new I18n(this.connection)

    let languageCode = Config.i18n.defaultLanguage
    if (Type.isInt(input) || typeof input === "string" && input.match(/^[a-z0-9]{70,90}$/gi)) {
      // user id
      languageCode = await i18n.getUserLocalizationCode(<number>input)
      // token
      languageCode = await i18n.getUserLocalizationCode(<string>input)
    } else if (typeof input === "string") languageCode = input

    return template({
      languageList: Config.i18n.languages,
      currentLanguage: languageCode
    })
  }
}

// Helpers

Handlebars.registerHelper("equal", (a, b, options) => {
  // @ts-ignore: Unreachable code error
  if (a == b) { return options.fn(this) }
  // @ts-ignore: Unreachable code error
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
