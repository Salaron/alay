import Pug from "pug"
import querystring from "querystring"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"
import { Utils } from "./utils"

export class WebView extends CommonModule {
  constructor(action: BaseAction) {
    super(action)
  }

  public async renderTemplate(module: string, action: string, locals: Pug.LocalsObject): Promise<string> {
    let currentLanguage = Config.i18n.defaultLanguage
    try {
      currentLanguage = await this.action.i18n.getUserLocalizationCode(this.requestData)
    } catch { } // tslint:disable-line

    const defaultLocals: Pug.LocalsObject = {
      pageTitle: "SunLight WebView", // page title can be overridden
      ...locals,
      userId: this.requestData.user_id,
      token: this.requestData.auth_token,
      webview: !this.requestData.requestFromBrowser,
      headers: JSON.stringify(this.getHeaders()),
      isAdmin: Config.server.admin_ids.includes(this.requestData.user_id || 0),
      languageList: Config.i18n.languages,
      currentLanguage
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
