import { exists, readFile } from "fs"
import showdown from "showdown"
import { promisify } from "util"
import { Logger } from "../core/logger"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"
import RequestData from "../core/requestData"
import { ErrorAPI } from "../models/error"

interface I18nCache {
  [localizationCode: string]: I18nSection
}
interface I18nSection {
  [sectionName: string]: any
}
interface I18nMdCache {
  [localizationCode: string]: {
    [type: string]: string
  }
}
enum I18nMarkdownType {
  TOS
}

let cache: I18nCache = {}
const mdCache: I18nMdCache = {}
let defaultStrings: I18nSection = {}

const log = new Logger("i18n")
export const showdownConverter = new showdown.Converter({
  tables: true,
  simpleLineBreaks: true,
  smartIndentationFix: true,
  openLinksInNewWindow: true,
  emoji: true,
  omitExtraWLInCodeBlocks: true,
  strikethrough: true
})

export async function init() {
  if (Object.keys(defaultStrings).length === 0) { // first-time load
    if (!await promisify(exists)(`./i18n/${Config.i18n.defaultLanguage}.json`))
      throw new Error(`File with default language is not exists`)
  }
  for (const localCode of Object.values(Config.i18n.languages)) {
    let sections
    try {
      sections = JSON.parse(await promisify(readFile)(`./i18n/${localCode}.json`, `utf-8`))
    } catch (err) {
      err.message = `Can't parse file with strings for '${localCode}' language`
      throw err
    }
    cache[localCode] = sections
    mdCache[localCode] = {}
  }
  defaultStrings = JSON.parse(await promisify(readFile)(`./i18n/${Config.i18n.defaultLanguage}.json`, `utf-8`))
}

export class I18n extends CommonModule {
  public markdownType = I18nMarkdownType
  constructor(action: BaseAction) {
    super(action)
  }

  /**
   * @param {RequestData} requestData
   * @param {string} code - language code
   */
  public async setUserLocalizationCode(requestData: RequestData, code: string): Promise<void> {
    if (Type.isInt(requestData.user_id) && requestData.user_id > 0) {
      await this.connection.execute("UPDATE users SET language = :code WHERE user_id = :user", {
        code,
        user: requestData.user_id
      })
    } else {
      throw new ErrorAPI(0)
    }
  }

  /**
   * @returns {Promise<string>} user language code
   */
  public async getUserLocalizationCode(requestData: RequestData): Promise<string> {
    let languageCode = Config.i18n.defaultLanguage

    let cookieLanguageCode = this.requestData.getCookie("language")
    if (cookieLanguageCode !== "" && Object.values(Config.i18n.languages).includes(cookieLanguageCode)) {
      languageCode = this.requestData.getCookie("language")
    } else if (Type.isInt(requestData.user_id) && requestData.user_id > 0) {
      languageCode = (await this.connection.first("SELECT language FROM users WHERE user_id = :user", { user: requestData.user_id })).language
    }

    if (!Object.values(Config.i18n.languages).includes(languageCode)) {
      log.warn(`Language code ${languageCode} is not exists in config. Using default language instead`)
      return Config.i18n.defaultLanguage
    }
    return languageCode
  }

  public async getStrings(input: RequestData | string, ...sections: string[]): Promise<any>
  public async getStrings(...sections: string[]): Promise<any>
  public async getStrings(input: RequestData | string, ...sections: string[]): Promise<any> {
    let languageCode = Config.i18n.defaultLanguage
    if (input instanceof RequestData) {
      languageCode = await this.getUserLocalizationCode(input)
    } else if (Type.isString(input) && Object.values(Config.i18n.languages).includes(input)) {
      languageCode = input
    } else {
      sections.push(input)
    }

    if (Config.server.debug_mode) await this.clearCache()
    let result: any = {}
    for (const section of sections) {
      result = {
        ...result,
        ...defaultStrings[section],
        ...cache[languageCode][section]
      }
    }
    result = {
      ...result,
      ...defaultStrings.common || {},
      ...cache[languageCode].common || {}
    }

    return result
  }

  public async getMarkdown(input: RequestData | string, type: I18nMarkdownType): Promise<string> {
    let languageCode = Config.i18n.defaultLanguage
    if (input instanceof RequestData) {
      languageCode = await this.getUserLocalizationCode(input)
    } else if (Type.isString(input) && Object.values(Config.i18n.languages).includes(input)) {
      languageCode = input
    }

    if (mdCache[languageCode] && mdCache[languageCode][I18nMarkdownType[type]]) return mdCache[languageCode][I18nMarkdownType[type]]

    let md = ``
    try {
      md = await promisify(readFile)(`./i18n/TOS/${languageCode}.md`, "UTF-8")
    } catch (err) {
      const i18n = await this.getStrings(languageCode)
      md += `*${i18n.notTranslated}*\n\n`
      md += await promisify(readFile)(`./i18n/TOS/${Config.i18n.defaultLanguage}.md`, "UTF-8")
    }

    return mdCache[languageCode][I18nMarkdownType[type]] = showdownConverter.makeHtml(md.replace(/--/gi, "—"))
  }

  public async clearCache() {
    cache = {}
    await init()
  }
}
