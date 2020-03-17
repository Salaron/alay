import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../models/constant"
import { Utils } from "../../../common/utils"

const unitDB = sqlite3.getUnitDB()

interface IUnitAlbumData {
  unit_id: number
  rank_max_flag: boolean
  love_max_flag: boolean
  rank_level_max_flag: boolean
  all_max_flag: boolean
  highest_love_per_unit: number
  total_love: number
  favorite_point: number
  sign_flag: boolean
}
interface ISeries {
  series_id: number
  unit_list: IUnitAlbumData[]
}
interface IAlbumSeriesUnitIdMap {
  [unitId: number]: number // series id
}
interface IOwningAlbumSeiresUnitIdMap {
  [seriesId: number]: IUnitAlbumData[]
}

const albumSeriesUnitIdMap: IAlbumSeriesUnitIdMap = {}
const owningAlbumSeriesTemplate: IOwningAlbumSeiresUnitIdMap = {}
export async function init() {
  (await unitDB.all("SELECT * FROM album_unit_series_m")).map(unitSeries => {
    albumSeriesUnitIdMap[unitSeries.unit_id] = unitSeries.album_series_id
    owningAlbumSeriesTemplate[unitSeries.album_series_id] = []
  })
}

export default class extends ApiAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const userAlbum = await this.connection.query("SELECT * FROM user_unit_album WHERE user_id = :user", {
      user: this.user_id
    })

    const owningInfo: IOwningAlbumSeiresUnitIdMap = Utils.createObjCopy(owningAlbumSeriesTemplate)
    userAlbum.map(cardData => {
      const albumSeriesId = albumSeriesUnitIdMap[cardData.unit_id]
      owningInfo[albumSeriesId].push(cardData)
    })

    const result: ISeries[] = Object.keys(owningInfo).map(albumSeriesIdString => {
      let albumSeriesId = parseInt(albumSeriesIdString, 10)
      return <ISeries>{
        series_id: albumSeriesId,
        unit_list: owningInfo[albumSeriesId]
      }
    })

    return {
      status: 200,
      result
    }
  }
}
