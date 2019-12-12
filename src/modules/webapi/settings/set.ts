import RequestData from "../../../core/requestData"
import assert from "assert"
import { AUTH_LEVEL, settingValues, settingNames } from "../../../models/constant"
import { TYPE } from "../../../common/type"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      name: TYPE.STRING,
      value: TYPE.INT
    }
  }
  public paramCheck() {
    assert(settingNames.includes(this.params.name) && typeof settingValues[this.params.name] !== "undefined", `Unknown setting name "${this.params.name}"`)
    assert(this.params.value >= 0 && this.params.value <= settingValues[this.params.name], `Invalid param "${this.params.value}" for setting name "${this.params.name}"`)
  }

  public async execute() {
    await this.connection.execute("INSERT INTO user_params (user_id, param_name, value) VALUES (:user, :name, :value) ON DUPLICATE KEY UPDATE value = :value", {
      user: this.user_id,
      name: this.params.name,
      value: this.params.value
    })

    return {
      status: 200,
      result: true
    }
  }
}
