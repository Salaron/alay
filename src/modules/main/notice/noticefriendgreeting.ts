import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import moment from "moment"
import { User } from "../../../common/user"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const user = new User(this.connection)

    let mails = await this.connection.query(`SELECT * FROM user_greet WHERE receiver_id = :user AND deleted_from_receiver = 0 ORDER BY notice_id DESC`, {
      user: this.user_id
    })

    let list: any[] = []
    await mails.forEachAsync(async (mail: any) => {
      let insertDate: string | number = Math.floor(moment.duration(moment(new Date()).diff(moment(new Date(mail.insert_date)))).asMinutes())
      let profileInfo = await this.connection.first(`SELECT user_id, name, level, setting_award_id FROM users WHERE user_id = :user`, {
        user: mail.affector_id
      })

      list.push({
        notice_id: mail.notice_id,
        new_flag: true,
        reference_table: 6,
        message: mail.message,
        list_message: mail.message,
        readed: mail.readed === 1,
        insert_date: insertDate > 1440 ? Math.floor(insertDate / 1440) + " day(s) ago" : insertDate > 60 ? Math.floor(insertDate / 60) + " hour(s) ago" : insertDate + " min(s) ago",
        affector: {
          user_data: {
            user_id: profileInfo.user_id,
            name: profileInfo.name,
            level: profileInfo.level
          },
          center_unit_info: await user.getCenterUnitInfo(mail.affector_id),
          setting_award_id: profileInfo.setting_award_id
        },
        reply_flag: mail.reply === 1
      })
    })

    await this.connection.query(`UPDATE user_greet SET readed = 1 WHERE receiver_id = :user AND readed = 0`, { 
      user: this.user_id 
    })

    return {
      status: 200,
      result: {
        next_id: 0,
        notice_list: list
      }
    }
  }
}