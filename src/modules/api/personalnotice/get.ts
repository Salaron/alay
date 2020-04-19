import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

interface IPersonalNoticeGetResponse {
  has_notice: boolean
  notice_id?: number
  type?: number
  title?: string
  contents?: string
}
export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    let result: IPersonalNoticeGetResponse = {
      has_notice: false
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
        const res = await this.connection.execute(`
        INSERT INTO user_personal_notice(user_id, notice_type, title, contents, agreed) VALUES (:user, :type, :title, :contents, 0)
        `, {
          user: this.user_id,
          type: notice.welcomeMessageType,
          title: notice.welcomeMessageTitle,
          contents: notice.welcomeMessageContents
        })

        return {
          status: 200,
          result: {
            has_notice: true,
            notice_id: res.insertId,
            type: notice.welcomeMessageType,
            title: notice.welcomeMessageTitle,
            contents: notice.welcomeMessageContents
          }
        }
      }
    }

    // get first notice from table (game can show only one notice at a time)
    const notice = await this.connection.first("SELECT * FROM user_personal_notice WHERE user_id = :user AND (agreed IS NULL OR agreed = 0)", {
      user: this.user_id
    })

    if (notice) {
      result = {
        has_notice: true,
        notice_id: notice.notice_id,
        type: notice.notice_type,
        title: notice.title,
        contents: notice.contents
      }
    } else {
      const cards = await this.connection.first("SELECT COUNT(unit_owning_user_id) as count FROM units WHERE user_id = :user", {
        user: this.user_id
      })
      if (cards.count >= 10000) {
        const i18n = await this.i18n.getStrings(this.requestData, "personalnotice")
        result = {
          has_notice: true,
          notice_id: -1,
          type: 1,
          title: i18n.youHaveTooLotCardsTitle,
          contents: i18n.youHaveTooLotCardsContent
        }
      }
    }

    return {
      status: 200,
      result
    }
  }
}
