import RequestData, { AUTH_LEVEL } from "../core/requestData"
import { Connection } from "../core/database_wrappers/mysql"
import { ActionResult } from "../typings/handlers"

export abstract class WebApiAction {
  public abstract requiredAuthLevel: AUTH_LEVEL;

  // tslint:disable-next-line
  protected user_id: number;
  protected connection: Connection;
  protected requestData: RequestData;
  protected params: any;

  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id // warn: user_id CAN be null only in AUTH LEVELS < AUTH_LEVEL.CONFIRMED_USER
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public paramTypes(): any {
    return {}
  }

  // tslint:disable-next-line
  public paramCheck(): void {
  }

  public abstract execute(): Promise<ActionResult | void>;
}
(<any>global).WebApiAction = WebApiAction
