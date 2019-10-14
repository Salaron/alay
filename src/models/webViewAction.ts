import { WV_REQUEST_TYPE } from "../core/requestData"
import { WebViewActionResult } from "../typings/handlers"

export abstract class WebViewAction extends WebApiAction {
  public abstract requestType: WV_REQUEST_TYPE
  public abstract execute(): Promise<WebViewActionResult>
}
(<any>global).WebViewAction = WebViewAction
