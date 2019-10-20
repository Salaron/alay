import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Utils } from "../../../common/utils"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const response = {
      has_notice: false,
      notice_id: 1,
      type: 1,
      title: "",
      contents: "",
      server_timestamp: Utils.timeStamp()
    }

    // if welcome message is enabled check if it is agreed
    if (Config.modules.personalNotice.welcomeMessageEnabled) {
      const notice = Config.modules.personalNotice
      const data = await this.connection.first("SELECT * FROM user_personal_notice WHERE user_id = :user AND contents = :cont AND title = :title", {
        user: this.user_id,
        cont: notice.welcomeMessageContents,
        title: notice.welcomeMessageTitle
      })
      if (!data) { // this notice is missing. let's fix that
        // insert into db
        const res = await this.connection.query(`
        INSERT INTO user_personal_notice(user_id, notice_type, title, contents, agreed) VALUES (:user, :type, :title, :contents, 0)
        `, {
          user: this.user_id,
          type: notice.welcomeMessageType,
          title: notice.welcomeMessageTitle,
          contents: notice.welcomeMessageContents
        })

        // just return prepared response
        response.has_notice = true
        response.notice_id = (<any>res).insertId
        response.type = notice.welcomeMessageType
        response.title = notice.welcomeMessageTitle
        response.contents = notice.welcomeMessageContents
        return {
          status: 200,
          result: response
        }
      }
    }

    // get first notice from table (game can show only one notice at a time)
    const notice = await this.connection.first("SELECT * FROM user_personal_notice WHERE user_id = :user AND (agreed IS NULL OR agreed = 0)", {
      user: this.user_id
    })

    if (notice) {
      response.has_notice = true
      response.notice_id = notice.notice_id
      response.type = notice.notice_type
      response.title = notice.title
      response.contents = notice.contents
    }

    return {
      status: 200,
      result: response
    }
  }
}
