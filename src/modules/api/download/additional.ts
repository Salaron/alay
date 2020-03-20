import { Download } from "../../../common/download"
import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.UPDATE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      target_os: TYPE.STRING,
      package_type: TYPE.INT
    }
  }
  public paramCheck() {
    return !Type.isUndefined(this.params.excluded_package_ids) ? Array.isArray(this.params.excluded_package_ids) : true
  }

  public async execute() {
    if (this.params.excluded_package_ids) this.params.excluded_package_ids.map((id: number) => {
      if (isNaN(Number(id))) throw new Error(`Invalid type provided`)
    })
    if (this.params.target_os !== "Android" && this.params.target_os !== "iOS") throw new Error("Invalid target_os")
    if (this.params.package_id && !(Type.isInt(this.params.package_id))) throw new Error("Invalid param")

    if (this.requestData.params.package_type === Download.TYPE.BOOTSTRAP) return {
      status: 200,
      result: Download.getAdditional()
    }
    return {
      status: 200,
      result: await Download.getPackagesByType(this.params.target_os, this.requestData.params.package_type, this.params.excluded_package_ids, this.params.package_id)
    }
  }
}
