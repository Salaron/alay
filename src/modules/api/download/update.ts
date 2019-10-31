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
      install_version: TYPE.STRING
    }
  }

  public async execute() {
    const clientExternal = this.params.external_version
    const clientInstall = this.params.install_version

    const serverVersion = Config.server.server_version
    const clientVersion = Utils.versionCompare(clientExternal, clientInstall) === -1 ? clientExternal : clientInstall

    if (Utils.versionCompare(serverVersion, clientExternal) == -1) throw new ErrorWebApi(`Client version can't be upper than server version`)

    const clientParts = clientVersion.split(".").map(Number)
    const serverParts = serverVersion.split(".").map(Number)

    if (clientParts.length != 2) throw new Error(`only 2 parts supported ("35.2", "35.3", etc...)`)
    let response: any[] = []
    const updateCache = Download.getUpdateLinks()

    while (clientParts[0] < serverParts[0]) {
      clientParts[0]++
      const arrayofversion = Object.keys(updateCache[clientParts[0]] || {})
      for (let i = 0; i <= parseInt(arrayofversion[arrayofversion.length - 1], 10); i++) {
        if (updateCache[clientParts[0]][arrayofversion[i]] === undefined) continue
        response = response.concat(updateCache[clientParts[0]][arrayofversion[i]])
      }
    }
    while (clientParts[1] <= serverParts[1]) {
      clientParts[1]++
      if (updateCache[clientParts[0]][clientParts[1]] === undefined) continue
      response = response.concat(updateCache[clientParts[0]][clientParts[1]])
    }

    return {
      status: 200,
      result: response
    }
  }
}
