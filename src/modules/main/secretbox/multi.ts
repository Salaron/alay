import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Secretbox } from "../../../common/secretbox"
import { TYPE } from "../../../common/type"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return { 
      id: TYPE.INT,
      secret_box_id: TYPE.INT
    }
  }

  public async execute() {
    return {
      status: 200,
      result: await new Secretbox(this.connection).makePon(this.user_id, this.params.secret_box_id, this.params.id)
    }
  }
}