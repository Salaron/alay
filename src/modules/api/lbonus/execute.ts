import moment from "moment"
import { User } from "../../../common/user"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, PERMISSION, REQUEST_TYPE } from "../../../models/constant"

const unitDB = sqlite3.getUnit()

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.STATIC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const currentYear = moment().utcOffset("+0900").format("YYYY")
    const currentMonth = moment().utcOffset("+0900").format("MM")
    const currentDay = moment().utcOffset("+0900").format("DD")
    const currentDate = moment().utcOffset("+0900").format("YYYY-MM-DD")
    const futureYear = moment().utcOffset("+0900").add(1, "month").format("YYYY")
    const futureMonth = moment().utcOffset("+0900").add(1, "month").format("MM")

    const currentMonthCalendar = await this.getCalendar(currentYear, currentMonth)
    const futureMonthCalendar = await this.getCalendar(futureYear, futureMonth)

    const receivedList = (await this.connection.query("SELECT day_of_month FROM login_received_list WHERE user_id=:user AND year=:year AND month=:month", {
      user: this.user_id,
      year: currentYear,
      month: currentMonth
    })).map(r => r.day_of_month )

    const response: any = {
      sheets: await this.getSheets(),
      calendar_info: {
        current_date: currentDate,
        current_month: {
          year: parseInt(currentYear),
          month: parseInt(currentMonth),
          days: []
        },
        next_month: {
          year: parseInt(futureYear),
          month: parseInt(futureMonth),
          days: []
        }
      },
      total_login_info: {
        login_count: (await this.connection.first(`SELECT COUNT(*) as cnt FROM login_received_list WHERE user_id = :user`, { user: this.user_id })).cnt,
        remaining_count: 0,
        reward: []
      },
      license_lbonus_list: [],
      start_dash_sheets: [],
      item_piece_info: {
        reset_exchange_rate: false,
        unite_info: []
      },
      class_system: User.getClassSystemStatus(this.user_id)
    }

    for (const day of currentMonthCalendar) {
      response.calendar_info.current_month.days.push({
        day: day.day_of_month,
        day_of_the_week: day.day_of_week,
        special_day: !!day.special_flag,
        special_image_asset: !!day.special_flag == true ? "assets/image/ui/login_bonus/loge_icon_01.png" : null,
        received: receivedList.indexOf(parseInt(day.day_of_month, 10)) != -1,
        item: {
          unit_id: day.item_type === 1001 ? day.item_id : undefined,
          item_id: day.item_type === 1000 ? day.item_id : undefined,
          add_type: day.item_type,
          amount: day.amount,
          is_rank_max: day.unit_id === null ? undefined : false
        }
      })
    }
    for (let i = 0; i < 14; i++) {
      const day = futureMonthCalendar[i]
      response.calendar_info.next_month.days.push({
        day: day.day_of_month,
        day_of_the_week: day.day_of_week,
        special_day: !!day.special_flag,
        special_image_asset: !!day.special_flag == true ? "assets/image/ui/login_bonus/loge_icon_01.png" : null,
        received: false,
        item: {
          unit_id: day.item_type === 1001 ? day.item_id : undefined,
          item_id: day.item_type === 1000 ? day.item_id : undefined,
          add_type: day.item_type,
          amount: day.amount,
          is_rank_max: day.unit_id === null ? undefined : false
        }
      })
    }

    await this.connection.query("UPDATE users SET last_login = :now WHERE user_id = :user", {
      user: this.user_id,
      now: Utils.parseDate(Date.now())
    })
    // check if lbonus already gained
    if (receivedList.includes(parseInt(currentDay))) return {
      status: 200,
      result: response
    }

    await this.connection.query("INSERT INTO login_received_list VALUES (:user, :year, :month, :day)", {
      user: this.user_id,
      year: currentYear,
      month: currentMonth,
      day: currentDay
    })
    const reward = await this.connection.first("SELECT item_id, item_type, amount FROM login_calendar_table WHERE year=:year AND month=:month AND day_of_month=:day", {
      year: currentYear,
      month: currentMonth,
      day: currentDay
    })
    response.calendar_info.get_item = {
      unit_id: reward.item_type === 1001 ? reward.item_id : undefined,
      item_id: reward.item_type === 1000 ? reward.item_id : undefined,
      add_type: reward.item_type,
      amount: reward.amount,
      item_category_id: 0,
      is_rank_max: reward.item_type === 1001 ? false : undefined,
      reward_box_flag: true
    }
    response.total_login_info.login_count += 1

    await this.item.addPresent(this.user_id, {
      type: reward.item_type,
      id: reward.item_id
    }, `Login Bonus Reward! [${currentDay}.${currentMonth}.${currentYear}]`, reward.amount)

    // Total Login Bonus
    await Object.keys(Config.lbonus.total_login_bonus).forEachAsync(async (day: string) => {
      if (response.total_login_info.login_count >= day) {
        const check = await this.connection.first(`SELECT * FROM login_bonus_total WHERE user_id = :user AND days = :days`, {
          user: this.user_id,
          days: day
        })
        if (check) return

        await this.connection.query(`INSERT INTO login_bonus_total (user_id, days) VALUES (:user, :day)`, { user: this.user_id, day })
        await this.item.addPresent(this.user_id, {
          name: Config.lbonus.total_login_bonus[day].name,
          id: Config.lbonus.total_login_bonus[day].item_id
        }, `Total Login Bonus Reward! [${day} day(s)]`, Config.lbonus.total_login_bonus[day].amount)
      } else if (response.total_login_info.remaining_count == 0) {
        const itemInfo = this.item.nameToType(Config.lbonus.total_login_bonus[day].name)
        response.total_login_info.remaining_count = parseInt(day) - response.total_login_info.login_count
        response.total_login_info.reward.push({
          item_id: Config.lbonus.total_login_bonus[day].item_id || itemInfo.itemId,
          add_type: itemInfo.itemType,
          amount: Config.lbonus.total_login_bonus[day].amount
        })
      } else return
    })

    return {
      status: 200,
      result: response
    }
  }

  private async getSheets() {
    const sheets = await this.connection.query(`SELECT * FROM login_bonus_sheets WHERE :now >= start_date AND :now < end_date`, {
      now: Utils.toSpecificTimezone(9)
    })
    if (sheets.length === 0) return []
    const result: any[] = []

    await sheets.forEachAsync(async (sheet: any) => {
      const data = {
        nlbonus_id: sheet.nlbonus_id,
        nlbonus_item_num: sheet.item_num,
        detail_text: sheet.detail_text,
        bg_asset: sheet.bg_asset,
        show_next_item: false,
        items: <any>[],
        stamp_num: 0,
        get_item: <any>[]
      }

      const items = await this.connection.query(`
      SELECT
        items.nlbonus_id, items.nlbonus_item_id, items.item_id, items.item_type,
        items.amount, items.seq, rec.insert_date, rec.user_id, rec.nlbonus_item_id AS received
      FROM login_bonus_sheets_items AS items
        LEFT JOIN login_bonus_sheets_received AS rec ON items.nlbonus_item_id = rec.nlbonus_item_id AND rec.user_id = :user
      WHERE nlbonus_id = :nlbonus ORDER BY seq ASC`, { user: this.user_id, nlbonus: sheet.nlbonus_id })

      let lastSeq = 0 // never use seq 0
      let getItemSeq = 0
      let lastInsertDate = "0000-00-00 00:00:00"
      await items.forEachAsync(async (seq: any) => {
        if (lastSeq === seq.seq) {
          data.items[data.items.length - 1].reward.push(this.parseRewardData(seq)) // "packet" reward
        } else data.items.push({
          seq: seq.seq,
          nlbonus_item_id: seq.nlbonus_item_id,
          reward: [this.parseRewardData(seq)]
        })

        if (seq.insert_date != null) {
          // item is already collected
          lastInsertDate = lastInsertDate < Utils.toSpecificTimezone(9, seq.insert_date) ? Utils.toSpecificTimezone(9, seq.insert_date) : lastInsertDate
          if (lastSeq != seq.seq) data.stamp_num += 1
        } else if (
          lastInsertDate < moment(new Date()).utcOffset(9).startOf("day").format("YYYY-MM-DD HH:mm:SS") ||
          getItemSeq === seq.seq
        ) {
          // new day -- new reward
          lastInsertDate = Utils.toSpecificTimezone(9)
          getItemSeq = seq.seq
          data.get_item.push(this.parseRewardData(seq))
          await this.connection.query(`INSERT INTO login_bonus_sheets_received (user_id, nlbonus_item_id) VALUES (:user, :id)`, {
            user: this.user_id,
            id: seq.nlbonus_item_id
          })
          await this.item.addPresent(this.user_id, {
            type: seq.item_type,
            id: seq.item_id || null
          }, `Special Login Bonus Reward [${data.stamp_num + 1} day(s)]`, seq.amount)
        }

        if (seq.received === null) data.show_next_item = true
        lastSeq = seq.seq
      })
      if (data.get_item.length === 0) data.get_item = undefined

      result.push(data)
    })
    return result
  }
  private parseRewardData(data: any) {
    return {
      unit_id: data.item_type === 1001 ? data.item_id : undefined,
      item_id: data.item_type != 1001 ? data.item_id : undefined,
      is_rank_max: data.item_type === 1001 ? false : undefined,
      add_type: data.item_type,
      amount: data.amount
    }
  }

  private async getCalendar(year: string, month: string) {
    const calendar = await this.connection.query("SELECT * FROM login_calendar_table WHERE year=:year AND month=:month", {
      year,
      month
    })
    if (calendar.length > 0) return calendar

    // generate random calendar
    const insertData: string[] = []
    let cardLimit = Utils.createObjCopy(Config.lbonus.calendar_generator.card_limit)
    const cards = (await unitDB.all(Config.lbonus.calendar_generator.cards_query)).map((u: any) => {
      return u.unit_id
    })

    const days = moment(month, "MM").daysInMonth()
    for (let i = 0; i < days; i++) {
      const dayOfWeek = moment([year, parseInt(month, 10) - 1]).add(i, "days").day()
      const dayOfMonth = i + 1

      const items = Utils.createObjCopy(Config.lbonus.calendar_generator.items)
      if (cardLimit > 0) items.push({
        name: "unit",
        amount: 1
      })

      const _item: any = items.randomValue() // tslint:disable-line
      let amount = 0

      if (Type.isInt(_item.min_amount) && Type.isInt(_item.max_amount)) amount = Utils.getRandomNumber(_item.min_amount, _item.max_amount)
      else if (Type.isArray(_item.amount)) amount = _item.amount.randomValue()
      else if (Type.isInt(_item.amount)) amount = _item.amount
      else throw new Error(`'Amount' field is missing`)

      const itemInfo = this.item.nameToType(_item.name)
      const specialFlag = Config.lbonus.calendar_generator.special_flag_types.includes(itemInfo.itemType) == true ? 1 : 0
      if (itemInfo.itemType === 1001) {
        cardLimit -= 1
        itemInfo.itemId = cards.randomValue()
      }

      insertData.push(`(${year}, ${month}, ${dayOfMonth}, ${dayOfWeek}, ${specialFlag}, ${itemInfo.itemType}, ${itemInfo.itemId}, ${amount})`)
    }

    await this.connection.query(`INSERT INTO login_calendar_table (year, month, day_of_month, day_of_week, special_flag, item_type, item_id, amount) VALUES ${insertData.join(",")}`)
    return await this.connection.query("SELECT * FROM login_calendar_table WHERE year=:year AND month=:month", {
      year,
      month
    })
  }
}
