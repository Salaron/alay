import moment from "moment"
import { TYPE } from "../../../common/type"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      filter_id: TYPE.INT,
      page: TYPE.INT
    }
  }

  public async execute() {
    const list: any = []
    let count = 0
    let noticeList: any
    const offset = this.params.page * 40

    const stubQuery = `(
      SELECT
        notice_id,
        affector_id,
        receiver_id,
        readed,
        filter_id,
        message,
        insert_date,
        type_id,
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
    ) s WHERE ((receiver_id IS NULL AND friend_status = 1) OR (receiver_id = :user))`

    if (this.params.filter_id === 0) {
      noticeList = await this.connection.query(`
      SELECT * FROM ${stubQuery} ORDER BY insert_date DESC LIMIT ${offset}, 40`, { user: this.user_id })
      count = (await this.connection.first(`SELECT count(*) as count FROM ${stubQuery}`, { user: this.user_id })).count + 1 // + handover/pass

      await this.connection.query(`UPDATE user_notice SET user_notice.readed = 1 WHERE receiver_id = :user`, { user: this.user_id })
    } else {
      noticeList = await this.connection.query(`SELECT * FROM ${stubQuery} AND filter_id = :filter ORDER BY insert_date DESC LIMIT ${offset}, 40`, {
        user: this.user_id,
        filter: this.params.filter_id
      })
      count = (await this.connection.first(`SELECT count(*) as count FROM ${stubQuery} AND filter_id = :filter`, {
        user: this.user_id,
        filter: this.params.filter_id
      })).count
    }

    const dateNow = moment(new Date())
    await noticeList.forEachAsync(async (notice: any) => {
      const dateInsert = moment(new Date(notice.insert_date))
      const elapsedTime = Math.floor(moment.duration(dateNow.diff(dateInsert)).asMinutes())
      const readed = notice.receiver_id == null ? true : !!notice.readed
      const affector = await this.getAffectorInfo(notice.affector_id)

      if (notice.message === null) {
        notice.message = await this.notice.getPreparedMessage(notice.type_id, {
          affectorName: affector.user_data.name
        })
      }
      list.push({
        notice_id: notice.notice_id,
        filter_id: notice.filter_id,
        notice_template_id: notice.filter_id,
        message: notice.message,
        readed,
        insert_date: elapsedTime > 1440 ? ` ${Math.floor(elapsedTime/1440)} day(s) ago` : elapsedTime > 60 ? ` ${Math.floor(elapsedTime/60)} hour(s) ago` : ` ${elapsedTime} min(s) ago`,
        affector: await this.getAffectorInfo(notice.affector_id)
      })
    })

    return {
      status: 200,
      result: {
        item_count: isNaN(count) ? 0 : count,
        notice_list: list
      }
    }
  }

  private async getAffectorInfo(userId: number) {
    const profileInfo = await this.connection.first(`SELECT user_id, name, level, setting_award_id FROM users WHERE user_id = :user`, {
      user: userId
    })
    return {
      user_data: {
        user_id: profileInfo.user_id,
        name: profileInfo.name,
        level: profileInfo.level
      },
      center_unit_info: await this.user.getCenterUnitInfo(profileInfo.user_id),
      setting_award_id: profileInfo.setting_award_id
    }
  }
}
