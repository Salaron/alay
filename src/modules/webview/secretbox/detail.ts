import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"
import { ErrorAPI } from "../../../models/error"

function getRarityString(rarity: number) {
  switch (rarity) {
    case 1: return "N"
    case 2: return "R"
    case 3: return "SR"
    case 4: return "UR"
    case 5: return "SSR"
    default: return "Unknown"
  }
}
function getAttributeString(attribute: number) {
  switch (attribute) {
    case 1: return "Smile"
    case 2: return "Pure"
    case 3: return "Cool"
    case 5: return "Any"
  }
}

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.NONE

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      id: TYPE.STRING
    }
  }

  public async execute(): Promise<any> {
    throw new ErrorAPI("NOT IMPLEMENTED")
  }
}
