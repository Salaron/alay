import { Connection } from "../core/database"

export enum eventType {
  TOKEN = 1,
  BATTLE = 2,
  FESTIVAL = 3,
  CHALLENGE = 4,
  QUEST = 5,
  DUTY = 6
}

export class Events {
  private connection: Connection
  constructor(connection: Connection) {
    this.connection = connection
  }

  public async getEventStatus(type: eventType) {
    let res = await this.connection.first("SELECT event_id, name, start_date, end_date, close_date, open_date, open_date, close_date FROM events_list WHERE event_category_id = :type ORDER BY close_date DESC", {
      type: type
    })
    if (!res) return {
      opened: false,
      active: false,
      id: 0,
      name: ""
    }
    let currDate = Utils.toSpecificTimezone(9)

    return {
      opened: res.close_date > currDate && res.open_date < currDate,
      active: (res.end_date > currDate && res.start_date < currDate) && (res.close_date > currDate && res.open_date < currDate),
      id: res.event_id,
      name: res.name
    }
  }
  public async getEventById(eventId: number) {
    let res = await this.connection.first("SELECT event_id, name, start_date, end_date, close_date, open_date FROM events_list WHERE event_id = :id", {
      id: eventId
    })
    if (!res) return {
      opened: false,
      active: false,
      id: 0,
      name: ""
    }
    let currDate = Utils.toSpecificTimezone(9)

    return {
      opened: res.close_date > currDate && res.open_date < currDate,
      active: (res.end_date > currDate && res.start_date < currDate) && (res.close_date > currDate && res.open_date < currDate),
      id: res.event_id,
      name: res.name
    }
  }

  public static getEventTypes() {
    return eventType
  }
}
(global as any).Events = Events