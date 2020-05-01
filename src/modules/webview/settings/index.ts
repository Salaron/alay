import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, modificatorNames, WV_REQUEST_TYPE, modificatorMaxValue } from "../../../models/constant"

export default class extends WebViewAction {
  public requiredAuthLevel = AUTH_LEVEL.CONFIRMED_USER
  public requestType = WV_REQUEST_TYPE.BOTH

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const [i18n, params, user] = await Promise.all([
      this.i18n.getStrings("login-startup", "settings-index"),
      this.user.getParams(this.user_id, modificatorNames),
      this.connection.first("SELECT name, mail FROM users WHERE user_id = :user", { user: this.user_id })
    ])
    const locals = {
      pageTitle: i18n.common.settings,
      i18n,
      user,
      modificators: this.getModificators(i18n, params)
    }

    return {
      status: 200,
      result: await this.webview.renderTemplate("settings", "index", locals)
    }
  }

  private getModificators(i18n: any, params: any) {
    return modificatorNames.map(name => {
      let states = []
      for (let i = 0; i <= modificatorMaxValue[name]; i++) {
        states.push({
          name: i18n.modificators[name + "-" + i],
          value: i,
          checked: params[name] !== undefined && params[name] === i
        })
      }
      return {
        name,
        title: i18n.modificators[name],
        tip: i18n.modificators[name + "Tip"],
        states
      }
    })
  }
}
