import extend from "extend"
import { exists, readFile } from "fs"
import showdown from "showdown"
import { promisify } from "util"
import { Log } from "../core/log"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"

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

const log = new Log("i18n")
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
    if (!await promisify(exists)(`${rootDir}/i18n/${Config.i18n.defaultLanguage}.json`))
      throw new Error(`File with default language is not exists`)
  }
  for (const localCode of Object.values(Config.i18n.languages)) {
    let sections
    try {
      sections = JSON.parse(await promisify(readFile)(`${rootDir}/i18n/${localCode}.json`, `utf-8`))
    } catch (err) {
      err.message = `Can't parse file with strings for '${localCode}' language`
      throw err
    }
    cache[localCode] = sections
    mdCache[localCode] = {}
  }
  defaultStrings = JSON.parse(await promisify(readFile)(`${rootDir}/i18n/${Config.i18n.defaultLanguage}.json`, `utf-8`))
}

export class I18n extends CommonModule {
  public markdownType = I18nMarkdownType
  constructor(action: BaseAction) {
    super(action)
  }

  /**
   * @param {number | string} input - User Id or token
   * @param {string} code - language code
   */
  public async setUserLocalizationCode(input: string | number, code: string): Promise<void> {
    if (Type.isInt(input)) {
      await this.connection.execute("UPDATE users SET language = :code WHERE user_id = :user", {
        code,
        user: input
      })
    } else if (Type.isString(input)) {
      await this.connection.execute("UPDATE auth_tokens SET language = :code WHERE token = :token", {
        code,
        token: input
      })
    }
  }

  /**
   * @param {number | string} input - User Id or token
   * @returns {Promise<string>} user language code
   */
  public async getUserLocalizationCode(input: number | string): Promise<string> {
    let code = ""
    if (typeof input === "string" && input.match(/^[a-z0-9]{70,90}$/gi)) {
      code = (await this.connection.first("SELECT language FROM auth_tokens WHERE token = :token", { token: input })).language
    } else {
      code = (await this.connection.first("SELECT language FROM users WHERE user_id=:user", { user: input })).language
    }

    if (!Object.values(Config.i18n.languages).includes(code)) {
      log.warn(`Language code ${code} is not exists in config. Using default language instead`)
      return Config.i18n.defaultLanguage
    }
    return code
  }

  /**
   * @param {number | string} input - User Id, token or Language code
   */
  public async getStrings(input: number | string, ...sections: string[]): Promise<any> {
    let languageCode = ""
    if (Type.isInt(input)) { // user id
      languageCode = await this.getUserLocalizationCode(<number>input)
    } else if (typeof input === "string" && input.match(/^[a-z0-9]{70,90}$/gi)) { // token
      languageCode = await this.getUserLocalizationCode(input)
    } else if (typeof input === "string") languageCode = input

    if (Config.server.debug_mode) await this.clearCache()
    const result: any = {}
    for (const section of sections) {
      extend(true, result, defaultStrings[section], cache[languageCode][section])
    }
    extend(true, result, defaultStrings.common || {}, cache[languageCode].common || {})

    return result
  }

  /**
   * @param {number | string} input - User Id, token or Language code
   */
  public async getMarkdown(input: number | string, type: I18nMarkdownType): Promise<string> {
    let languageCode = ""
    if (Type.isInt(input)) { // user id
      languageCode = await this.getUserLocalizationCode(<number>input)
    } else if (typeof input === "string" && input.match(/^[a-z0-9]{70,90}$/gi)) { // token
      languageCode = await this.getUserLocalizationCode(input)
    } else if (typeof input === "string") languageCode = input
    if (mdCache[languageCode] && mdCache[languageCode][I18nMarkdownType[type]]) return mdCache[languageCode][I18nMarkdownType[type]]

    let md = ``
    try {
      md = await promisify(readFile)(`${rootDir}/i18n/TOS/${languageCode}.md`, "UTF-8")
    } catch (err) {
      const i18n = await this.getStrings(languageCode)
      md += `*${i18n.notTranslated}*\n\n`
      md += await promisify(readFile)(`${rootDir}/i18n/TOS/${Config.i18n.defaultLanguage}.md`, "UTF-8")
    }

    return mdCache[languageCode][I18nMarkdownType[type]] = showdownConverter.makeHtml(md.replace(/--/gi, "—"))
  }

  public async clearCache() {
    cache = {}
    await init()
  }
}
