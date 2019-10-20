import { Connection } from "../core/database_wrappers/mysql"
import RequestData from "../core/requestData"
import { IApiResult, IWebApiResult, IWebViewResult } from "./handlers"
import { AUTH_LEVEL, WV_REQUEST_TYPE, REQUEST_TYPE, PERMISSION } from "./constant"

abstract class BaseAction {
  public abstract requiredAuthLevel: AUTH_LEVEL

  // tslint:disable-next-line
  protected user_id: number
  protected connection: Connection
  protected requestData: RequestData
  protected params: any

  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id // warn: user_id CAN be null only in AUTH LEVELS < AUTH_LEVEL.CONFIRMED_USER
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public paramTypes(): any {
    return {}
  }

  public paramCheck(): void {
    return
  }

  public abstract execute(): Promise<IApiResult | void> // void if there is throwable error
}

export abstract class WebApiAction extends BaseAction {
  public abstract execute(): Promise<IWebApiResult>
}
(<any>global).WebApiAction = WebApiAction

export abstract class WebViewAction extends BaseAction {
  public abstract requestType: WV_REQUEST_TYPE
  public abstract execute(): Promise<IWebViewResult>
}
(<any>global).WebViewAction = WebViewAction

export abstract class ApiAction extends BaseAction {
  public abstract requestType: REQUEST_TYPE
  public abstract permission: PERMISSION
}
(<any>global).ApiAction = ApiAction
