import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Download } from "../../../common/download"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.UPDATE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramCheck() {
    return (Array.isArray(this.params.excluded_package_ids))
  }

  public async execute() {
    this.params.excluded_package_ids.map((id: number) => {
      if (isNaN(Number(id))) throw new ErrorUser(`Invalid type provided`, this.user_id)
    })
    if (this.params.os !== "Android" && this.params.os !== "iOS") throw new ErrorUser(`Invalid os`, this.user_id)

    if (this.requestData.params.package_type === 0) return {
      status: 200,
      result: Download.getBatch()
    }
    if (this.requestData.params.package_type === 1) return {
      status: 200,
      result: await Download.getSongPackages(this.params.os, this.params.excluded_package_ids)
    }

    return {
      status: 200,
      result: []
    }
  }
}
