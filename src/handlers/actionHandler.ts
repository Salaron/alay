import RequestData from "../core/requestData"
import { HANDLER_TYPE, REQUEST_TYPE, PERMISSION, TYPE, RESPONSE_TYPE } from "../types/const"
import { Log } from "../core/log"

const log = new Log("Action Handler")
let cache = <any>{}

interface Options {
  xmc?: string
  responseType?: RESPONSE_TYPE
}

export default async function executeAction(module: string, action: string, requestData: RequestData, options: Options = {}) {
  if (module.length === 0 || action.length === 0) throw new ErrorUser(`Module or Action was not provided (${module}/${action})`, requestData.user_id)
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
    if (!require.cache[require.resolve(`${moduleFolder}/${module}/${action}`)]) {
      let loaded = await import(`${moduleFolder}/${module}/${action}`)
      if (loaded.init) await loaded.init()
      if (!cache[module]) cache[module] = {}
      cache[module][action] = loaded
    }
  
    let body = new cache[module][action].default(requestData)
    // Main related things
    if (requestData.handlerType === HANDLER_TYPE.MAIN) {
      if (options.responseType != body.requestType && body.requestType != REQUEST_TYPE.BOTH) throw new Error(`Invalid request type (action: ${body.requestType}, param: ${options.responseType}) on ${module}/${action}`)
      // XMC check in api should be done in mainHandler
      if ((body.permission != PERMISSION.NOXMC) && options.responseType != RESPONSE_TYPE.MULTI) {
        let xmcStatus = await requestData.checkXMC(body.permission === PERMISSION.STATIC)
        if (xmcStatus === false) throw new Error(`Invalid X-Message-Code (${module}/${action}); user #${requestData.user_id}`)
      }
    }

    if (requestData.auth_level < body.requiredAuthLevel) throw new ErrorUser(`No permissions`, requestData.user_id)
    if (body.paramTypes) checkParamTypes(requestData.formData, body.paramTypes())
    if (body.paramCheck) body.paramCheck()
    return await body.execute()
  } catch (err) {
    // handle module errors
    throw err
  } finally {
    if (Config.server.debug_mode) delete require.cache[require.resolve(`${moduleFolder}/${module}/${action}`)]
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
      default: throw new Error(`pidor`)
    }
  }

  if (Array.isArray(inputType)) {
    log.warn("Checking arrays is not support")
  } else if (typeof inputType === "object") {
    Object.keys(inputType).forEach(field => {
      if (typeof inputType[field] === "object") checkParamTypes(input[field], inputType[field])
      else if (!input[field]) throw new Error(`Field "${field}" is missing in input`)
      else if (!checkType(input[field], inputType[field])) throw new Error(`Expected type "${TYPE[inputType[field]]}" in "${field}" field`)
    })
  } else {
    if (!checkType(input, inputType)) throw new Error(`Expected ${TYPE[inputType]}`)
  }
}