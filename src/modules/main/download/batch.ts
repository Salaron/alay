import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import { Download } from "../../../common/download"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.UPDATE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {

    if (this.requestData.params.package_type === 0) return {
      status: 200,
      result: Download.getBatch()
    }
    if (this.requestData.params.package_type === 1) return {
      status: 200,
      result: Download.getSong()
    }

    return {
      status: 200,
      result: []
    }
  }
}
