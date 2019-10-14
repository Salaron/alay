import RequestData, { REQUEST_TYPE, PERMISSION, RESPONSE_TYPE, HANDLER_TYPE, AUTH_LEVEL } from "../core/requestData"
import { Log } from "../core/log"
import "../models/webApiAction"
import "../models/webViewAction"
import "../models/mainAction"
import { TYPE } from "../common/type"
import { Utils } from "../common/utils"

const log = new Log("Action Handler")
const cache = <any>{}

interface Options {
  xmc?: string
  responseType?: RESPONSE_TYPE
}

export default async function executeAction(module: string, action: string, requestData: RequestData, options: Options = {}) {
  if (
    !module ||
    !action ||
    module.length === 0 ||
    action.length === 0
  ) throw new ErrorUser(`Module or Action is not provided (${module}/${action})`, requestData.user_id)
  module = module.replace(/\s/g, "X").toLowerCase()
  action = action.replace(/\s/g, "X").toLowerCase()

  let moduleFolder = "../modules/"
  switch (requestData.handlerType) {
    case HANDLER_TYPE.MAIN: moduleFolder += "main"; break
    case HANDLER_TYPE.WEBAPI: moduleFolder += "webapi"; break
    case HANDLER_TYPE.WEBVIEW: moduleFolder += "webview"; break
    default: throw new Error(`Unknown handler type`)
  }

  try {
    // load action
    if (!cache[`${moduleFolder}/${module}/${action}`]) {
      const loaded = await import(`${moduleFolder}/${module}/${action}`)
      if (loaded.init) await loaded.init()
      cache[`${moduleFolder}/${module}/${action}`] = loaded
    }

    const body = new cache[`${moduleFolder}/${module}/${action}`].default(requestData)
    // Main related things
    if (requestData.handlerType === HANDLER_TYPE.MAIN) {
      if (options.responseType != body.requestType && body.requestType != REQUEST_TYPE.BOTH) throw new Error(`Invalid request type (action: ${body.requestType}, param: ${options.responseType}) on ${module}/${action}`)
      // XMC check in api should be done in mainHandler
      if ((body.permission != PERMISSION.NOXMC) && options.responseType != RESPONSE_TYPE.MULTI) {
        const xmcStatus = await requestData.checkXMC(body.permission === PERMISSION.STATIC)
        if (xmcStatus === false) throw new Error(`Invalid X-Message-Code (${module}/${action}); user #${requestData.user_id}`)
      }
    }

    if (requestData.auth_level < body.requiredAuthLevel) throw new ErrorUser(`No permissions`, requestData.user_id)
    if (body.paramTypes) checkParamTypes(requestData.params, body.paramTypes())
    if (body.paramCheck) body.paramCheck()
    let hrTime = process.hrtime()
    let result = await body.execute()
    hrTime = process.hrtime(hrTime)
    log.debug(`[${module}/${action}] ${Math.floor(hrTime[0] * 1000 + hrTime[1] / 1000000)} ms`, `Perfomance`)

    if (requestData.handlerType === HANDLER_TYPE.MAIN) {
      if (!Array.isArray(result.result) && result.status === 200) {
        result.result.server_timestamp = Utils.timeStamp()
        if (requestData.auth_level >= AUTH_LEVEL.CONFIRMED_USER) {
          try {
            result.result.present_cnt = (await requestData.connection.first("SELECT count(incentive_id) as count FROM reward_table WHERE user_id = :user AND opened_date IS NULL", {
              user: requestData.user_id
            })).count
          } catch { } // tslint:disable-line
        }
      }
    }
    return result
  } catch (err) {
    // handle module errors
    if (err instanceof ErrorCode) return err.response
    throw err
  } finally {
    if (Config.server.debug_mode) {
      delete require.cache[require.resolve(`${moduleFolder}/${module}/${action}`)]
      delete cache[`${moduleFolder}/${module}/${action}`]
    }
  }
}

function checkParamTypes(input: any, inputType: any) {
  function checkType(value: any, type: TYPE) {
    switch (type) {
      case TYPE.INT: return Type.isInt(value)
      case TYPE.FLOAT: return Type.isFloat(value)
      case TYPE.NUMBER: return Type.isNumber(value)
      case TYPE.STRING: return Type.isString(value)
      case TYPE.FLOAT: return Type.isBoolean(value)
      case TYPE.NULL: return Type.isNull(value)
      default: throw new Error(`Unsupported type provided`)
    }
  }

  if (Array.isArray(inputType)) {
    log.warn("Checking arrays is not support")
  } else if (typeof inputType === "object") {
    Object.keys(inputType).forEach((field) => {
      if (typeof inputType[field] === "object") checkParamTypes(input[field], inputType[field])
      else if (Type.isNullDef(input[field])) throw new Error(`Field "${field}" is missing in input`)
      else if (!checkType(input[field], inputType[field])) throw new Error(`Expected type "${TYPE[inputType[field]]}" in "${field}" field`)
    })
  } else {
    if (!checkType(input, inputType)) throw new Error(`Expected ${TYPE[inputType]}`)
  }
}
