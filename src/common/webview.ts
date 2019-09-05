import Handlebars from "handlebars"
import moment from "moment"
import { promisify } from "util"
import { readFile } from "fs"
import { Connection } from "../core/database_wrappers/mysql"
import { I18n } from "./i18n"

interface WebViewTemplates {
  [templateName: string]: Handlebars.TemplateDelegate | undefined
}
let templates: WebViewTemplates = {}

export class WebView {
  public Handlebars = Handlebars
  public connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
  }

  public static async getTemplate(module: string, action: string): Promise<Handlebars.TemplateDelegate> {
    if (typeof templates[`${module}-${action}`] != "undefined") return <Handlebars.TemplateDelegate>templates[`${module}-${action}`]

    let template = Handlebars.compile(await promisify(readFile)(`${rootDir}/webview/${module}/${action}.html`, "utf-8"))
    if (Config.server.debug_mode) {
      templates[`${module}-${action}`] = undefined // remove previously saved template
    } else templates[`${module}-${action}`] = template
    return template
  }

  public async getCurrentOnline() {
    return (await this.connection.first("SELECT COUNT(*) as cnt FROM user_login WHERE last_activity > :now", {
      now: moment().subtract(10, "minutes").format("YYYY-MM-DD HH:mm:ss")
    })).cnt
  }

  public async getLanguageModalTemplate(userId: number): Promise<string>
  public async getLanguageModalTemplate(token: string): Promise<string>
  public async getLanguageModalTemplate(input: number | string): Promise<string> {
    let template = await WebView.getTemplate("common", "changelanguage")

    return template({
      languageList: Config.i18n.languages,
      currentLanguage: await new I18n(this.connection).getUserLocalizationCode(<any>input)
    })
  }
}

// Helpers

Handlebars.registerHelper("equal", function (a, b, options) {
  // @ts-ignore: Unreachable code error
  if (a == b) { return options.fn(this) }
  // @ts-ignore: Unreachable code error
  return options.inverse(this)
})