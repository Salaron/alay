import { REQUEST_TYPE, PERMISSION } from "../core/requestData"

export abstract class MainAction extends WebApiAction {
  public abstract requestType: REQUEST_TYPE
  public abstract permission: PERMISSION
}
(<any>global).MainAction = MainAction
