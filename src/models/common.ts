import { Connection } from "../core/database_wrappers/mysql"
import RequestData from "../core/requestData"
import { BaseAction } from "./actions"

export class CommonModule {
  public action: BaseAction
  protected connection: Connection
  protected requestData: RequestData
  protected userId: number

  constructor(action: BaseAction) {
    this.connection = action.connection
    this.requestData = action.requestData
    this.userId = action.user_id

    this.action = action
  }
}
