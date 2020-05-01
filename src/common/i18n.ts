import deepmerge from "deepmerge"
import { exists, promises } from "fs"
import showdown from "showdown"
import { promisify } from "util"
import { Logger } from "../core/logger"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"

enum I18nMarkdownType {
  TOS
}

interface ICache {
  markdown: {
    [languageCode: string]: {
      [type: string]: string
    }
  }
  strings: {
    [languageCode: string]: IStringsSection
  }
}
interface IDefault {
  strings: IStringsSection
  markdown:{
    [type: string]: string
  }
}
interface IStringsSection {
  [key: string]: string | IStringsSection
}

let Cache: ICache = {
  strings: {},
  markdown: {}
}
let Default: IDefault = {
  strings: {},
  markdown: {}
}

const logger = new Logger("i18n")
export const showdownConverter = new showdown.Converter({
  tables: true,                   // add tables support
  simpleLineBreaks: true,         // enter = new line
  smartIndentationFix: true,      // idk
  openLinksInNewWindow: true,     // should be useful on markdown pages
  emoji: true,                    // just emojis...
  omitExtraWLInCodeBlocks: true,  // idk
  strikethrough: true             // idk
})

export async function init() {
  if (Object.keys(Default.strings).length === 0) { // first-time load
    if (!await promisify(exists)(`./i18n/${Config.i18n.defaultLanguage}.json`))
      throw new Error("File with default language is not exists")
  }
  let markdownFiles = []
  for (const file of await promises.readdir("./i18n/markdown")) {
    // TODO: make it strict
    const fileSplit = file.split("_")
    const name = fileSplit[0]
    const language = fileSplit[1].split(".")[0]
    markdownFiles.push({
      filename: file,
      name,
      language
    })
  }
  for (const language of Object.values(Config.i18n.languages)) {
    const stringsFile = JSON.parse(await promises.readFile(`./i18n/${language}.json`, `utf-8`))
    if (!stringsFile.common) stringsFile.common = {}
    Cache.strings[language] = stringsFile
    Cache.markdown[language] = {}
    for (const file of markdownFiles) {
      if (file.language === language) {
        const markdownFile = await promises.readFile(`./i18n/markdown/${file.filename}`, "utf-8")
        Cache.markdown[language][file.name] = showdownConverter.makeHtml(markdownFile.replace(/--/gi, "—"))
      }
    }
  }
  Default.strings = Cache.strings[Config.i18n.defaultLanguage]
  Default.markdown = Cache.markdown[Config.i18n.defaultLanguage]
}

export class I18n extends CommonModule {
  public markdownType = I18nMarkdownType
  constructor(action: BaseAction) {
    super(action)
  }

  /**
   * @param {string} languageCode
   */
  public async setUserLocalizationCode(languageCode: string): Promise<void> {
    if (Type.isInt(this.userId) && this.userId > 0) {
      await this.connection.execute("UPDATE users SET language = :code WHERE user_id = :user", {
        code: languageCode,
        user: this.userId
      })
    }
  }

  /**
   * @returns {Promise<string>} user language code
   */
  public async getUserLocalizationCode(): Promise<string> {
    let languageCode = Config.i18n.defaultLanguage

    let cookieLanguageCode = this.requestData.getCookie("language")
    if (Type.isInt(this.userId) && this.userId > 0) {
      languageCode = (await this.connection.first("SELECT language FROM users WHERE user_id = :user", { user: this.userId })).language
    } else if (cookieLanguageCode !== null) {
      languageCode = cookieLanguageCode
    }

    if (!Object.values(Config.i18n.languages).includes(languageCode)) {
      logger.debug(`Language code ${languageCode} is not exists in config. Using default language instead`)
      return Config.i18n.defaultLanguage
    }
    return languageCode
  }

  public async getStrings(...sections: string[]): Promise<any> {
    let languageCode = await this.getUserLocalizationCode()

    if (Config.server.debug_mode) await this.clearCache()
    let strings: any = {}
    for (const section of sections) {
      if (!Cache.strings[languageCode][section]) Cache.strings[languageCode][section] = {}
      strings = deepmerge.all([strings, Default.strings[section], Cache.strings[languageCode][section]])
    }
    // add common strings
    // @ts-ignore
    strings.common = deepmerge.all([Default.strings.common, Cache.strings[languageCode].common])

    return strings
  }

  public async getMarkdown(type: I18nMarkdownType): Promise<string> {
    let languageCode = await this.getUserLocalizationCode()
    if (Config.server.debug_mode) await this.clearCache()
    const markdownType = I18nMarkdownType[type]
    if (Cache.markdown[languageCode] && Cache.markdown[languageCode][markdownType]) {
      return Cache.markdown[languageCode][markdownType]
    } else {
      return Default.markdown[markdownType]
    }
  }

  public async clearCache() {
    // reset cache
    Cache = {
      markdown: {},
      strings: {}
    }
    await init()
  }
}
