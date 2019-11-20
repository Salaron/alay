import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Download } from "../../../common/download"
import { Utils } from "../../../common/utils"
import { TYPE } from "../../../common/type"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.UPDATE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      external_version: TYPE.STRING,
      install_version: TYPE.STRING,
      target_os: TYPE.STRING
    }
  }

  public async execute() {
    if (this.params.target_os !== "Android" && this.params.target_os !== "iOS")
      throw new ErrorUser(`Invalid target_os`, this.user_id)
    const clientExternal = this.params.external_version
    const clientInstall = this.params.install_version

    const serverVersion = Config.server.server_version
    const clientVersion = Utils.versionCompare(clientExternal, clientInstall) === -1 ? clientExternal : clientInstall

    if (Utils.versionCompare(serverVersion, clientExternal) === -1)
      throw new ErrorCode(1234, `Not ready`)
    if (clientVersion.split(".").length === 0) throw new ErrorCode(1234, "nope :p")

    const packages = await Download.getUpdatePackages(this.params.target_os, clientVersion)
    return {
      status: 200,
      result: packages
    }
  }
}
