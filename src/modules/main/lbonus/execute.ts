import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"
import moment from "moment"

const unitDB = sqlite3.getUnit()

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.STATIC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private params: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.params = requestData.params
    this.requestData = requestData
  }

  public async execute() {
    const item = new Item(this.connection)

    let currentYear = moment(new Date()).utcOffset("+0900").format("YYYY")
    let currentMonth = moment(new Date()).utcOffset("+0900").format("M")
    let currentDay = moment(new Date()).utcOffset("+0900").format("D")
    let currentDate = moment(new Date()).utcOffset("+0900").format("YYYY-MM-DD")
    let futureYear = moment(new Date()).utcOffset("+0900").add(1, "month").format("YYYY")
    let futureMonth = moment(new Date()).utcOffset("+0900").add(1, "month").format("M")

    let currentMonthCalendar = await this.getCalendar(currentYear, currentMonth)
    let futureMonthCalendar = await this.getCalendar(futureYear, futureMonth)

    let receivedList = (await this.connection.query("SELECT day_of_month FROM login_received_list WHERE user_id=:user AND year=:year AND month=:month", {
      user: this.user_id,
      year: currentYear,
      month: currentMonth
    })).map(function (r: any) { return r.day_of_month })

    let response: any = {
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
      item_piece_info: {
        reset_exchange_rate: false,
        unite_info: []
      },
      class_system: User.getClassSystemStatus(this.user_id),
      server_timestamp: Utils.timeStamp()
    }

    for (let i = 0; i < currentMonthCalendar.length; i++) {
      let day = currentMonthCalendar[i]
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
      let day = futureMonthCalendar[i]
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
    let reward = await this.connection.first("SELECT item_id, item_type, amount FROM login_calendar_table WHERE year=:year AND month=:month AND day_of_month=:day", {
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

    await item.addPresent(this.user_id, {
      type: reward.item_type,
      id: reward.item_id
    }, `Login Bonus Reward! [${currentDay}.${currentMonth}.${currentMonth}]`, reward.amount)

    // Total Login Bonus
    await Object.keys(Config.lbonus.total_login_bonus).forEachAsync(async(day: string) => {
      if (response.total_login_info.login_count >= day) {
        let check = await this.connection.first(`SELECT * FROM login_bonus_total WHERE user_id = :user AND days = :days`, { 
          user: this.user_id, 
          days: day 
        })
        if (check) return

        await this.connection.query(`INSERT INTO login_bonus_total (user_id, days) VALUES (:user, :day)`, { user: this.user_id, day: day })
        await item.addPresent(this.user_id, {
          name: Config.lbonus.total_login_bonus[day].name,
          id: Config.lbonus.total_login_bonus[day].item_id
        }, `Total Login Bonus Reward! [${day} day(s)]`, Config.lbonus.total_login_bonus[day].amount)
      } else if (response.total_login_info.remaining_count == 0 ) {
        let itemInfo = Item.nameToType(Config.lbonus.total_login_bonus[day].name)
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
    let sheets = await this.connection.query(`SELECT * FROM login_bonus_sheets WHERE :now >= start_date AND :now <= end_date`, {
      now: new Date(Utils.toSpecificTimezone(9))
    })
    if (sheets.length === 0) return []
    let result = []

    await sheets.forEachAsync(async (sheet: any) => {
      let data: any = {
        nlbonus_id: sheet.nlbonus_id,
        nlbonus_item_num: sheet.item_num,
        detail_text: sheet.detail_text,
        bg_asset: sheet.bg_asset,
        show_next_item: false,
        items: [],
        stamp_num: 0
      }

      let items = await this.connection.query(`
      SELECT 
        items.nlbonus_id, items.nlbonus_item_id, items.item_id, items.item_type, 
        items.amount, items.seq, rec.insert_date, rec.user_id, rec.nlbonus_item_id AS received
      FROM login_bonus_sheets_items AS items 
        LEFT JOIN login_bonus_sheets_received AS rec ON items.nlbonus_item_id = rec.nlbonus_item_id AND rec.user_id = :user
      WHERE nlbonus_id = :nlbonus`, { // TODO: order by
        user: this.user_id,
        nlbonus: sheet.nlbonus_id
      })

      await items.forEachAsync(async (item: any) => {
        // TODO
      })

      result.push(data)
    })
  }

  private async getCalendar(year: string, month: string) {
    let calendar = await this.connection.query("SELECT * FROM login_calendar_table WHERE year=:year AND month=:month", { 
      year: year, 
      month: month 
    })
    if (calendar.length > 0) return calendar

    // generate random calendar
    let insertData: string[] = []
    let cardLimit = Utils.createObjCopy(Config.lbonus.calendar_generator.card_limit)
    let cards = (await unitDB.all(Config.lbonus.calendar_generator.cards_query)).map((u: any) => {
      return u.unit_id
    })

    let days = moment(month, "MM").daysInMonth()
    for (let i = 0; i < days; i++){
      let dayOfWeek = moment([year, parseInt(month, 10) - 1]).add(i, "days").day()
      let dayOfMonth = i + 1

      let items = Utils.createObjCopy(Config.lbonus.calendar_generator.items)
      if (cardLimit > 0) items.push({
        name: "card",
        amount: 1
      })

      let _item = items.randomValue()
      let amount = 0

      if (Type.isInt(_item.min_amount) && Type.isInt(_item.max_amount)) amount = Utils.getRandomNumber(_item.min_amount, _item.max_amount)
      else if (Type.isArray(_item.amount)) amount = _item.amount.randomValue()
      else if (Type.isInt(_item.amount)) amount = _item.amount
      else throw new Error(`'Amount' field is missing`)

      let itemInfo = Item.nameToType(_item.name)
      let specialFlag = Config.lbonus.calendar_generator.special_flag_types.includes(itemInfo.itemType) == true ? 1 : 0
      if (itemInfo.itemType === 1001) {
        cardLimit -= 1
        itemInfo.itemId = cards.randomValue()
      }

      insertData.push(`(${year}, ${month}, ${dayOfMonth}, ${dayOfWeek}, ${specialFlag}, ${itemInfo.itemType}, ${itemInfo.itemId}, ${amount})`)
    }

    await this.connection.query(`INSERT INTO login_calendar_table (year, month, day_of_month, day_of_week, special_flag, item_type, item_id, amount) VALUES ${insertData.join(",")}`)
    return await this.connection.query("SELECT * FROM login_calendar_table WHERE year=:year AND month=:month", { 
      year: year, 
      month: month 
    })
  }
}