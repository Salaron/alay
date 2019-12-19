import { EventStub } from "../common/eventstub"
import { I18n } from "../common/i18n"
import { Item } from "../common/item"
import { Live } from "../common/live"
import { Notice } from "../common/notice"
import { Secretbox } from "../common/secretbox"
import { Unit } from "../common/unit"
import { User } from "../common/user"
import { WebView } from "../common/webview"
import { Connection } from "../core/database/mysql"
import RequestData from "../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE, WV_REQUEST_TYPE } from "./constant"
import { IApiResult, IWebApiResult, IWebViewResult } from "./handlers"

export abstract class BaseAction {
  public abstract requiredAuthLevel: AUTH_LEVEL

  public item: Item
  public user: User
  public unit: Unit
  public live: Live
  public eventStub: EventStub
  public secretbox: Secretbox
  public notice: Notice
  public i18n: I18n
  public webview: WebView

  // tslint:disable-next-line
  public user_id: number
  public connection: Connection
  public requestData: RequestData
  public params: any

  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id // warn: user_id CAN be null only in AUTH LEVELS < AUTH_LEVEL.CONFIRMED_USER
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData

    this.item = new Item(this)
    this.user = new User(this)
    this.unit = new Unit(this)
    this.live = new Live(this)
    this.eventStub = new EventStub(this)
    this.secretbox = new Secretbox(this)
    this.notice = new Notice(this)
    this.i18n = new I18n(this)
    this.webview = new WebView(this)
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
