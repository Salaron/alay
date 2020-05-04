import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Download } from "../../../common/download"
import { TYPE } from "../../../common/type"
import { ErrorAPI } from "../../../models/error"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.UPDATE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      package_type: TYPE.INT,
      os: TYPE.STRING
    }
  }

  public paramCheck() {
    return (Array.isArray(this.params.excluded_package_ids))
  }

  public async execute() {
    this.params.excluded_package_ids.map((id: number) => {
      if (isNaN(Number(id))) throw new ErrorAPI("Invalid type provided")
    })
    if (this.params.os !== "Android" && this.params.os !== "iOS") throw new ErrorAPI("Invalid os")
    return {
      status: 200,
      result: await Download.getPackagesByType(
        this.params.os,
        this.params.package_type,
        this.params.excluded_package_ids
      )
    }
  }
}
