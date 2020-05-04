import { Download } from "../../../common/download"
import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"
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
      target_os: TYPE.STRING,
      package_type: TYPE.INT,
      package_id: TYPE.INT
    }
  }
  public paramCheck() {
    return !Type.isUndefined(this.params.excluded_package_ids) ? Array.isArray(this.params.excluded_package_ids) : true
  }

  public async execute() {
    // TODO: move this check to paramTypes when it'll support array checking
    if (this.params.excluded_package_ids) this.params.excluded_package_ids.map((id: number) => {
      if (isNaN(Number(id))) throw new ErrorAPI("Invalid type")
    })
    if (this.params.target_os !== "Android" && this.params.target_os !== "iOS") throw new ErrorAPI("Invalid target_os")
    return {
      status: 200,
      result: await Download.getPackageById(
        this.params.target_os,
        this.params.package_type,
        this.params.package_id,
        this.params.excluded_package_ids
      )
    }
  }
}
