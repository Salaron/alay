import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import moment from "moment"
import { Utils } from "../../../common/utils"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.BOTH
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const birth = await this.connection.first("SELECT birth_day, birth_month FROM users WHERE user_id = :user", {
      user: this.user_id
    })
    const isTodayBirthday = moment(birth.birth_day, "DD").isSame(Date.now(), "day") && moment(birth.birth_month, "MM").isSame(Date.now(), "month")
    const presents = await this.connection.first("SELECT count(incentive_id) as count FROM reward_table WHERE user_id = :user AND opened_date IS NULL", {
      user: this.user_id
    })
    const greets = await this.connection.first(`SELECT count(notice_id) as count FROM user_greet WHERE receiver_id = :user AND deleted_from_receiver = 0 AND readed = 0`, {
      user: this.user_id
    })
    const approval = await this.connection.first(`SELECT count(*) as count FROM user_friend WHERE recipient_id = :user AND status = 0 AND readed = 0`, {
      user: this.user_id
    })
    const variety = await this.connection.first(`
    SELECT COUNT(*) as count FROM (
      SELECT
        notice_id,
        receiver_id,
        readed,
        (
          SELECT
            status
          FROM
            user_friend
          WHERE
            (initiator_id = :user OR recipient_id = :user) AND
            (initiator_id = user_notice.affector_id OR recipient_id = user_notice.affector_id)
            AND STATUS = 1
          LIMIT 1
        ) as friend_status
      FROM
        user_notice
    ) s
    WHERE
      (receiver_id IS NULL AND friend_status = 1)
      OR (receiver_id = :user AND readed = 0)`, { user: this.user_id })

    if (variety.count == null) variety.count = 0
    const response = {
      friend_action_cnt: greets.count + variety.count,
      friend_greet_cnt: greets.count,
      friend_variety_cnt: variety.count,
      present_cnt: presents.count,
      friends_approval_wait_cnt: approval.count,
      free_muse_gacha_flag: false,
      free_aqours_gacha_flag: false,
      server_datetime: Utils.parseDate(Date.now()),
      server_timestamp: Utils.timeStamp(),
      notice_friend_datetime: "2000-01-01 12:00:00",
      notice_mail_datetime: "2000-01-01 12:00:00",
      is_today_birthday: isTodayBirthday,
      license_info: {
        expired_info: [],
        licensed_info: []
      },
      using_buff_info: [],
      show_anniversary: false,
      is_klab_id_task_flag: false,
      klab_id_tasc_can_sync: false
    }

    return {
      status: 200,
      result: response
    }
  }
}