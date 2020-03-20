import "../models/actions"
import { TYPE } from "../common/type"
import { Utils } from "../common/utils"
import { Logger } from "../core/logger"
import RequestData from "../core/requestData"
import { AUTH_LEVEL, HANDLER_TYPE, PERMISSION, REQUEST_TYPE, RESPONSE_TYPE } from "../models/constant"
import { ErrorAPI, ErrorWebApi } from "../models/error"

const log = new Logger("Action Handler")
interface Options {
  xmc?: string
  responseType?: RESPONSE_TYPE
}

export default async function executeAction(moduleName: string, actionName: string, requestData: RequestData, options: Options = {}) {
  if (
    !moduleName ||
    !actionName ||
    moduleName.length === 0 ||
    actionName.length === 0
  ) throw new Error(`Module or action not provided (${moduleName}/${actionName})`)
  moduleName = moduleName.toLowerCase().replace(/[^a-z]/g, "")
  actionName = actionName.toLowerCase().replace(/[^a-z]/g, "")

  let moduleFolder = "../modules/"
  switch (requestData.handlerType) {
    case HANDLER_TYPE.API: moduleFolder += "api"; break
    case HANDLER_TYPE.WEBAPI: moduleFolder += "webapi"; break
    case HANDLER_TYPE.WEBVIEW: moduleFolder += "webview"; break
    default: throw new Error(`Unknown handler type`)
  }

  try {
    // load submodule (action)
    const actionModule = await import(`${moduleFolder}/${moduleName}/${actionName}`)
    if (actionModule.init && !actionModule.loaded) {
      await actionModule.init()
      actionModule.loaded = true
    }

    const Action = new actionModule.default(requestData)
    // API handler related things
    if (requestData.handlerType === HANDLER_TYPE.API) {
      if (options.responseType !== Action.requestType && Action.requestType !== REQUEST_TYPE.BOTH)
        throw new Error(`Invalid request type (action: ${Action.requestType}, param: ${options.responseType}) on ${moduleName}/${actionName}`)

      // XMC check for "/api" endpoint should be done in API handler
      if ((Action.permission !== PERMISSION.NOXMC) && options.responseType !== RESPONSE_TYPE.MULTI) {
        const xmcStatus = await requestData.checkXMessageCode(Action.permission === PERMISSION.STATIC)
        if (xmcStatus === false)
          throw new Error(`Invalid X-Message-Code (${moduleName}/${actionName})`)
      }
    }

    if (requestData.auth_level === AUTH_LEVEL.UPDATE && Action.requiredAuthLevel !== AUTH_LEVEL.UPDATE) {
      throw new ErrorAPI("You need to get latest update first")
    }
    if (requestData.auth_level < Action.requiredAuthLevel)
      throw new Error(`No permissions (${moduleName}/${actionName})`)

    try {
      // parameters type and sanity check
      if (Action.paramTypes) checkParamTypes(requestData.params, Action.paramTypes())
      if (Action.paramCheck && Action.paramCheck() === false)
        throw new Error("some params have invalid format")
    } catch (err) {
      throw new Error(`${moduleName}/${actionName}: ${err.message}`)
    }

    const response = await Action.execute()
    if (
      requestData.handlerType === HANDLER_TYPE.API && options.responseType === RESPONSE_TYPE.SINGLE &&
      !Array.isArray(response.result) && response.status === 200
    ) {
      response.result.server_timestamp = Utils.timeStamp()
      if (requestData.auth_level >= AUTH_LEVEL.CONFIRMED_USER) {
        const user = await requestData.connection.first(`
            SELECT
              count(incentive_id) as present_cnt
            FROM
              reward_table
            WHERE
              user_id = :userId AND opened_date IS NULL`, {
          userId: requestData.user_id
        })
        response.result.present_cnt = user.present_cnt
      }
    }

    return response
  } catch (err) {
    // handle some API errors
    if (err instanceof ErrorAPI)
      return err.response
    else
      throw err
  } finally {
    if (Config.server.debug_mode) {
      delete require.cache[require.resolve(`${moduleFolder}/${moduleName}/${actionName}`)]
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
      default: throw new Error("Unsupported type provided")
    }
  }

  if (Array.isArray(inputType)) {
    log.warn("Array checking is not supported")
  } else if (typeof inputType === "object") {
    Object.keys(inputType).forEach((field) => {
      if (typeof inputType[field] === "object")
        checkParamTypes(input[field], inputType[field])
      else if (Type.isNullDef(input[field]))
        throw new Error(`"${field}" is missing in input`)
      else if (!checkType(input[field], inputType[field]))
        throw new Error(`Expected type "${TYPE[inputType[field]]}" on "${field}"`)
    })
  } else {
    if (!checkType(input, inputType))
      throw new Error(`Expected ${TYPE[inputType]}`)
  }
}
