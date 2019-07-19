import RequestData from "../core/requestData"
import { HANDLER_TYPE, REQUEST_TYPE, PERMISSION, TYPE, RESPONSE_TYPE } from "../../types/const"

let cache = <any>{}

interface Options {
  xmc?: string
  responseType: RESPONSE_TYPE
}

export default async function executeAction(module: string, action: string, requestData: RequestData, options: Options) {
  try {
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
    checkParams(requestData.formData, body.params)
    return await body.execute()
  } catch (err) {

  }
  

}

function checkParams(input: any, inputTypes: any) {
  function checkType(value: any, type: TYPE) {
    if (!type) return true
    if (Array.isArray(type)) type = type[0]
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

  // input is array
  if (Array.isArray(input)) {
    input.forEach(value => {
      if (typeof value === "object") checkParams(value, inputTypes)
      else if (checkType(value, inputTypes) === false) throw new Error(`Expected ${TYPE[inputTypes] || TYPE[inputTypes[0]]}`)
    })
  } else if (typeof input === "object") {
    Object.keys(input).forEach(field => {
      if (typeof inputTypes[field] === "object") checkParams(input[field], inputTypes[field])
      else if (inputTypes[field] && checkType(input[field], inputTypes[field]) === false) throw new Error(`Expected ${TYPE[inputTypes[field]]} for ${field}`)
    })
  } else {
    if (checkType(input, inputTypes) === false) throw new Error(`Expected ${TYPE[inputTypes]}`)
  }
}