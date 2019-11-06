import { BaseAction } from "../models/actions"
import { Utils } from "./utils"
import { CommonModule } from "../models/common"

enum noticeType {
  REMOVED_FROM_FRIENDS = 1,
  SEND_FRIEND_REQUEST,
  REJECTED_FRIEND_REQUEST,
  ACCEPTED_FRIEND_REQUEST
}
enum filter {
  ALL = 0,
  MAIN_STORY = 1,
  SIDE_STORY = 2,
  NEW_MEMBER = 3,
  LIVE_CLEAR = 4,
  EVENT_CLEAR = 5,
  FRIENDS = 6,
  UNKNOWN = 99
}

export class Notice extends CommonModule {
  public FILTER = filter
  public TYPE = noticeType
  constructor(action: BaseAction) {
    super(action)
  }

  public async getNoticeStrings(userId: number) {
    // based on current user language
    return this.action.i18n.getStrings(userId, "notice")
  }

  public async getPreparedMessage(userId: number, noticeTypeId: noticeType | number, values: any) {
    const strings = await this.getNoticeStrings(userId)
    const message = strings[noticeType[noticeTypeId]]
    if (!message) throw new Error(`Unknown noticeTypeId: ${noticeTypeId}`)
    return Utils.prepareTemplate(message, values)
  }
  public async addNotice(affector: number, filterId: filter, message: string | noticeType, receiver?: number) {
    await this.connection.execute(`INSERT INTO user_notice (affector_id, receiver_id, filter_id, message, type_id) VALUES (:aff, :rec, :fil, :msg, :type)`, {
      aff: affector,
      rec: receiver || null,
      fil: filterId,
      msg: typeof message === "string" ? message : null,
      type: typeof message === "number" ? message : null
    })
  }
}
