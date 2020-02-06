import "../models/actions"
import { TYPE } from "../common/type"
import { Utils } from "../common/utils"
import { Logger } from "../core/logger"
import RequestData from "../core/requestData"
import { AUTH_LEVEL, HANDLER_TYPE, PERMISSION, REQUEST_TYPE, RESPONSE_TYPE } from "../models/constant"
import { ErrorUserId, ErrorAPI } from "../models/error"

const log = new Logger("Action Handler")
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
  ) throw new ErrorUserId(`Module or Action is not provided (${module}/${action})`, requestData.user_id)
  module = module.replace(/\s/g, "X").toLowerCase()
  action = action.replace(/\s/g, "X").toLowerCase()

  let moduleFolder = "../modules/"
  switch (requestData.handlerType) {
    case HANDLER_TYPE.API: moduleFolder += "api"; break
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
    if (requestData.handlerType === HANDLER_TYPE.API) {
      if (options.responseType != body.requestType && body.requestType != REQUEST_TYPE.BOTH) throw new Error(`Invalid request type (action: ${body.requestType}, param: ${options.responseType}) on ${module}/${action}`)
      // XMC check in api should be done in mainHandler
      if ((body.permission != PERMISSION.NOXMC) && options.responseType != RESPONSE_TYPE.MULTI) {
        const xmcStatus = await requestData.checkXMessageCode(body.permission === PERMISSION.STATIC)
        if (xmcStatus === false) throw new Error(`Invalid X-Message-Code (${module}/${action}); user #${requestData.user_id}`)
      }
    }

    if (requestData.auth_level < body.requiredAuthLevel) throw new ErrorUserId(`No permissions (${module}/${action})`, requestData.user_id)
    try {
      if (body.paramTypes) checkParamTypes(requestData.params, body.paramTypes())
    } catch (err) {
      throw new Error(`${module}/${action}: ${err.message}`)
    }
    if (body.paramCheck && body.paramCheck() === false) throw new Error(`${module}/${action}: params is not valid`)

    let hrTime = process.hrtime()
    let response = await body.execute()
    hrTime = process.hrtime(hrTime)
    log.debug(`[${module}/${action}] ${Math.floor(hrTime[0] * 1000 + hrTime[1] / 1000000)} ms`)

    if (requestData.handlerType === HANDLER_TYPE.API && options.responseType === RESPONSE_TYPE.SINGLE) {
      if (!Array.isArray(response.result) && response.status === 200 && HANDLER_TYPE) {
        response.result.server_timestamp = Utils.timeStamp()
        if (requestData.auth_level >= AUTH_LEVEL.CONFIRMED_USER) {
          try {
            response.result.present_cnt = (await requestData.connection.first("SELECT count(incentive_id) as count FROM reward_table WHERE user_id = :user AND opened_date IS NULL", {
              user: requestData.user_id
            })).count
          } catch { } // tslint:disable-line
        }
      }
    }
    return response
  } catch (err) {
    // handle module errors
    if (err instanceof ErrorAPI) return err.response
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
      case TYPE.BOOLEAN: return Type.isBoolean(value)
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
