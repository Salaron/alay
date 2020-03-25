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
    const [userBirth, present, message, notification, friendRequest, friendApproval] = await Promise.all([
      this.connection.first("SELECT birth_day, birth_month FROM users WHERE user_id = :user", {
        user: this.user_id
      }),
      this.connection.first("SELECT count(incentive_id) as count FROM reward_table WHERE user_id = :user AND opened_date IS NULL", {
        user: this.user_id
      }),
      this.connection.first(`SELECT count(notice_id) as count FROM user_greet WHERE receiver_id = :user AND deleted_from_receiver = 0 AND readed = 0`, {
        user: this.user_id
      }),
      this.connection.first(`
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
        OR (receiver_id = :user AND readed = 0)
      `, {
        user: this.user_id
      }),
      this.connection.first("SELECT count(*) as count FROM user_friend WHERE recipient_id = :user AND status = 0 AND readed = 0", {
        user: this.user_id
      }),
      this.connection.first("SELECT count(*) as count FROM user_friend WHERE initiator_id = :user AND status = 0 AND readed = 0", {
        user: this.user_id
      })
    ])

    const currentDatetime = Utils.toSpecificTimezone(9)
    const isSameDay = moment(userBirth.birth_day, "DD").isSame(Utils.toSpecificTimezone(9), "day")
    const isSameMonth = moment(userBirth.birth_month, "MM").isSame(Utils.toSpecificTimezone(9), "month")

    const result = {
      friend_action_cnt: (notification.count || 0) + message.count,
      friend_greet_cnt: message.count,
      friend_variety_cnt: notification.count || 0,
      friend_new_cnt: friendRequest.count + friendApproval.count,
      friends_request_cnt: friendRequest.count,
      firends_approval_wait_cnt: friendApproval.count,
      present_cnt: present.count,
      server_datetime: currentDatetime,
      server_timestamp: Utils.timeStamp(),
      notice_friend_datetime: currentDatetime,
      notice_mail_datetime: currentDatetime,
      is_today_birthday: isSameDay && isSameMonth,
      license_info: {
        expired_info: [],
        licensed_info: []
      },
      using_buff_info: [],
      klab_id_task_can_sync: false,
      is_klab_id_task_flag: false,
      has_unread_announce: false,
      secret_box_id_list: [
        [], // μ's
        []  // Aqours
      ],
      exchange_badge_cnt: [
        0, // seal shop
        0  // point shop
      ],
      limit_bonus_ur_info: [],
      free_ticket_list: [],
      free_muse_gacha_flag: false,
      free_aqours_gacha_flag: false
    }

    return {
      status: 200,
      result
    }
  }
}
