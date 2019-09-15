import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.MULTI
  public permission: PERMISSION = PERMISSION.NOXMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const mainDeck = (await this.connection.first("SELECT main_deck as deck FROM users WHERE user_id=:user", {
      user: this.user_id
    })).deck
    const data = await this.connection.query(`
    SELECT deck.user_id, deck.deck_name, deck.unit_deck_id, slot.slot_id, slot.unit_owning_user_id
    FROM user_unit_deck as deck INNER JOIN user_unit_deck_slot as slot ON (deck.unit_deck_id = slot.deck_id AND deck.user_id = slot.user_id) WHERE deck.user_id=:user
    AND unit_deck_id IN (1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18)`, { user: this.user_id })

    const decks: any = {}
    const deckIDs = []
    for (const s of data) {
      if (!decks[s.unit_deck_id]) {
        deckIDs.push(s.unit_deck_id)
        decks[s.unit_deck_id] = {
          unit_deck_id: s.unit_deck_id,
          deck_name: s.deck_name,
          main_flag: s.unit_deck_id == mainDeck,
          unit_owning_user_ids: []
        }
      }
      decks[s.unit_deck_id].unit_owning_user_ids.push({
        position: s.slot_id,
        unit_owning_user_id: s.unit_owning_user_id
      })
    }
    const response: any[] = []
    deckIDs.map(id => {
      response.push(decks[id])
    })

    return {
      status: 200,
      result: response
    }
  }
}
