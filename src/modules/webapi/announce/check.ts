import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../core/requestData"
import { TYPE } from "../../../common/type"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      id: TYPE.INT
    }
  }

  public async execute() {
    const announce = await this.connection.first("SELECT * FROM webview_announce WHERE id = :id", {
      id: this.params.id
    })

    return {
      status: 200,
      result: !Type.isNull(announce)
    }
  }
}
