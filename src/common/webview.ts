import { promises, readFileSync } from "fs"
import Pug from "pug"
import querystring from "querystring"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"
import { Utils } from "./utils"

let unitIcons: { [unitId: number]: { 1: string, 2: string }} = {}

const unitDB = sqlite3.getUnitDB()
export async function init() {
  const allUnits = await unitDB.all("SELECT unit_id, unit_number, normal_icon_asset, rank_max_icon_asset FROM unit_m")
  allUnits.map(unit => {
    unitIcons[unit.unit_id] = {
      1: `icon/${unit.unit_number}.png`,
      2: `iconRankup/${unit.unit_number}.png`
    }
  })
}

let assets = JSON.parse(readFileSync("webpack-assets.json", "utf-8"))
export class WebView extends CommonModule {
  constructor(action: BaseAction) {
    super(action)
  }

  public async renderTemplate(module: string, action: string, locals: Pug.LocalsObject): Promise<string> {
    let currentLanguage = Config.i18n.defaultLanguage
    try {
      currentLanguage = await this.action.i18n.getUserLocalizationCode(this.requestData)
    } catch { } // tslint:disable-line

    if (Config.server.debug_mode) {
      assets = JSON.parse(await promises.readFile("webpack-assets.json", "utf-8"))
    }
    let partnerUnitIcon = null
    if (this.requestData.user_id) {
      const partner: { unit_id: number, rank: 1 | 2 } = await this.connection.first("SELECT unit_id, \`rank\` FROM users JOIN units ON users.partner_unit = units.unit_owning_user_id WHERE users.user_id = :userId", {
        userId: this.userId
      })
      partnerUnitIcon = unitIcons[partner.unit_id][partner.rank]
    }
    const defaultLocals: Pug.LocalsObject = {
      pageTitle: "SunLight WebView", // page title can be overridden
      ...locals,
      userId: this.requestData.user_id,
      token: this.requestData.auth_token,
      webview: !this.requestData.requestFromBrowser,
      headers: JSON.stringify(this.getHeaders()),
      publicKey: JSON.stringify(Config.server.PUBLIC_KEY),
      isAdmin: Config.server.admin_ids.includes(this.requestData.user_id || 0),
      languageList: Config.i18n.languages,
      webpackAssets: assets,
      currentLanguage,
      partnerUnitIcon
    }

    return Pug.renderFile(`./webview/view/${module}/${action}.pug`, {
      cache: !Config.server.debug_mode,
      compileDebug: Config.server.debug_mode,
      ...defaultLocals
    })
  }

  private getHeaders() {
    const authorizeHeader = {
      consumerKey: Config.client.consumer_key.length > 0 ? Config.client.consumer_key : "lovelive_test",
      timeStamp: Utils.timeStamp(),
      version: "1.1",
      nonce: "WA0",
      token: this.requestData.auth_token
    }
    const requestHeaders = this.requestData.headers
    return {
      "user-id": this.requestData.user_id ? this.requestData.user_id.toString() : "",
      "bundle-version": requestHeaders["bundle-version"] || Config.client.application_version,
      "client-version": requestHeaders["client-version"] || Config.server.server_version,
      "application-id": requestHeaders["application-id"] || Config.client.application_id,
      "os-version": requestHeaders["os-version"],
      "authorize": querystring.stringify(authorizeHeader)
    }
  }
}
