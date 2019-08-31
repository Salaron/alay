import { WV_REQUEST_TYPE } from "../../core/requestData"

export abstract class WebViewAction extends WebApiAction {
  public abstract requestType: WV_REQUEST_TYPE
}
(<any>global).WebViewAction = WebViewAction