import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Download } from "../../../common/download"
import { TYPE } from "../../../common/type"
import { ErrorUserId } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.UPDATE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      target_os: TYPE.STRING
    }
  }
  public paramCheck() {
    return !Type.isUndefined(this.params.excluded_package_ids) ? Array.isArray(this.params.excluded_package_ids) : true
  }

  public async execute() {
    if (this.params.excluded_package_ids) this.params.excluded_package_ids.map((id: number) => {
      if (isNaN(Number(id))) throw new ErrorUserId(`Invalid type provided`, this.user_id)
    })
    if (this.params.target_os !== "Android" && this.params.target_os !== "iOS") throw new ErrorUserId(`Invalid target_os`, this.user_id)

    if (this.requestData.params.package_type === 0) return {
      status: 200,
      result: Download.getAdditional()
    }
    if (this.requestData.params.package_type === 1) return {
      status: 200,
      result: await Download.getSongPackages(this.params.target_os, this.params.excluded_package_ids)
    }

    return {
      status: 200,
      result: []
    }
  }
}
