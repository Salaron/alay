import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../types/const"

export default class {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  private user_id: number
  private connection: Connection
  private requestData: RequestData
  private formData: any
  constructor(requestData: RequestData) {
    this.user_id = <number>requestData.user_id
    this.connection = requestData.connection
    this.formData = requestData.formData
    this.requestData = requestData
  }

  public paramTypes() {
    return {}
  }
  public paramCheck() {
    return true
  }

  public async execute() {
    let mainDeck = (await this.connection.first("SELECT main_deck as deck FROM users WHERE user_id=:user", { 
      user: this.user_id 
    })).deck
    let data = await this.connection.query(`
    SELECT deck.user_id, deck.deck_name, deck.unit_deck_id, slot.slot_id, slot.unit_owning_user_id 
    FROM user_unit_deck as deck INNER JOIN user_unit_deck_slot as slot ON (deck.unit_deck_id = slot.deck_id AND deck.user_id = slot.user_id) WHERE deck.user_id=:user 
    AND unit_deck_id IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18)`, { user: this.user_id })

    let decks: any = {}
    let deckIDs = []
    for (let i = 0; i < data.length; i++) {
      let s = data[i]
      if (!decks[s.unit_deck_id]) {
        deckIDs.push(s.unit_deck_id)
        decks[s.unit_deck_id] = {
          unit_deck_id: s.unit_deck_id,
          deck_name: s.deck_name,
          main_flag: s.unit_deck_id == mainDeck.deck,
          unit_owning_user_ids: []
        }
      }
      decks[s.unit_deck_id].unit_owning_user_ids.push({
        position: s.slot_id,
        unit_owning_user_id: s.unit_owning_user_id
      })
    }
    let response = []
    for (let i = 0; i < deckIDs.length; i++) {
      response.push(decks[deckIDs[i]])
    }

    return {
      status: 200,
      result: response
    }
  }
}