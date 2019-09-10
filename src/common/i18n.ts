import { Connection } from "../core/database_wrappers/mysql"
import { Log } from "../core/log"
import { promisify } from "util"
import { readFile, exists } from "fs"
import extend from "extend"
import showdown from "showdown"

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
let mdCache: I18nMdCache = {}
let defaultStrings: I18nSection = {}

const log = new Log("i18n")
export const showdownConverter = new showdown.Converter({
  tables: true, 
  simpleLineBreaks: true, 
  requireSpaceBeforeHeadingText: true
})

export async function init() {
  if (Object.keys(defaultStrings).length === 0) { // first-time load
    if (!await promisify(exists)(`${rootDir}/i18n/${Config.i18n.defaultLanguage}.json`)) 
      throw new Error(`File with default language is not exists`)
  }
  for (let localCode of Object.values(Config.i18n.languages)) {
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

export class I18n {
  private connection: Connection
  public markdownType = I18nMarkdownType
  constructor(connection: Connection) {
    this.connection = connection
  }

  public async setUserLocalizationCode(userId: number, code: string): Promise<void>
  public async setUserLocalizationCode(token: string, code: string): Promise<void>
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

  public async getUserLocalizationCode(userId: number): Promise<string>
  public async getUserLocalizationCode(token: string): Promise<string>
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

  public async getStrings(languageCode: string, ...sections: string[]): Promise<any>
  public async getStrings(userId: number, ...sections: string[]): Promise<any>
  public async getStrings(token: string, ...sections: string[]): Promise<any>
  public async getStrings(input: number | string, ...sections: string[]): Promise<any> {
    let languageCode = ""
    if (Type.isInt(input)) { // user id
      languageCode = await this.getUserLocalizationCode(<number>input)
    } else if (typeof input === "string" && input.match(/^[a-z0-9]{70,90}$/gi)) { // token
      languageCode = await this.getUserLocalizationCode(input)
    } else if (typeof input === "string") languageCode = input

    if (Config.server.debug_mode) await I18n.clearCache()
    let result: any = {}
    for (let section of sections) {
      extend(true, result, defaultStrings[section], cache[languageCode][section])
    }
    extend(true, result, defaultStrings["common"] || {}, cache[languageCode]["common"] || {})

    return result
  }

  public async getMarkdown(languageCode: string, type: I18nMarkdownType): Promise<string>
  public async getMarkdown(userId: number, type: I18nMarkdownType): Promise<string>
  public async getMarkdown(token: string, type: I18nMarkdownType): Promise<string>
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
      let i18n = await this.getStrings(languageCode)
      md += `*${i18n.notTranslated}*\n\n` 
      md += await promisify(readFile)(`${rootDir}/i18n/TOS/${Config.i18n.defaultLanguage}.md`, "UTF-8")
    }

    return mdCache[languageCode][I18nMarkdownType[type]] = showdownConverter.makeHtml(md.replace(/--/gi, "—"))
  }

  public static async clearCache() {
    cache = {}
    await init()
  }
}