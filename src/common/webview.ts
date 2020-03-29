import Pug from "pug"
import RequestData from "../core/requestData"
import { BaseAction } from "../models/actions"
import { CommonModule } from "../models/common"

export class WebView extends CommonModule {
  constructor(action: BaseAction) {
    super(action)
  }

  public async renderTemplate(module: string, action: string, requestData: RequestData, values: any): Promise<string> {
    let currentLanguage = Config.i18n.defaultLanguage
    try {
      currentLanguage = await this.action.i18n.getUserLocalizationCode(this.requestData)
    } catch { } // tslint:disable-line

    const options = {
      pageTitle: "SunLight WebView",
      ...values,
      userId: requestData.user_id,
      token: requestData.auth_token,
      webview: !requestData.requestFromBrowser,
      headers: JSON.stringify(requestData.getWebapiHeaders()),
      isAdmin: Config.server.admin_ids.includes(requestData.user_id || 0),
      languageList: Config.i18n.languages,
      currentLanguage
    }

    return Pug.renderFile(`./webview/view/${module}/${action}.pug`, {
      cache: !Config.server.debug_mode,
      compileDebug: Config.server.debug_mode,
      ...options
    })
  }
}
