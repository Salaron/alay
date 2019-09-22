import RequestData from "../../../core/requestData"
import { REQUEST_TYPE, PERMISSION, AUTH_LEVEL } from "../../../core/requestData"
import assert from "assert"

export default class extends MainAction {
  public requestType: REQUEST_TYPE = REQUEST_TYPE.SINGLE
  public permission: PERMISSION = PERMISSION.XMC
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramCheck() {
    if (
      (!Array.isArray(this.params.unit_deck_list) && this.params.unit_deck_list.length > 0)
    ) throw new Error(`unit_deck_list should be Array`)
  }

  public async execute() {
    const decks = []
    const usedDeckIDs: number[] = []
    let mainDeckId = 0

    const allUnits: number[] = []
    for (const deck of this.params.unit_deck_list) {
      assert(Type.isInt(deck.unit_deck_id), "unit_deck_id is not in integer")
      assert(Type.isString(deck.deck_name), "deck_name is not a string")
      assert(Type.isInt(deck.main_flag), "main flag is not in integer")
      assert(typeof deck.unit_deck_detail === "object" && Array.isArray(deck.unit_deck_detail), "unit_deck_detail is not an Array")
      assert([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].includes(deck.unit_deck_id), "unit_deck_id is invalid")
      assert(!usedDeckIDs.includes(deck.unit_deck_id), "unit_deck_id used twice")
      assert(deck.deck_name.length <= 10, "deck_name more than 10 symbols")
      if (deck.main_flag == 1) {
        if (mainDeckId != 0) throw new Error(`main deck flag used twice`)
        mainDeckId = deck.unit_deck_id
      }
      if (deck.unit_deck_detail.length != 9) continue

      const usedPositions: number[] = []
      const usedUnitIds: number[] = []
      for (const slot of deck.unit_deck_detail) {
        assert(Type.isInt(slot.position), "position is not an integer")
        assert(Type.isInt(slot.unit_owning_user_id), "unit_owning_user_id is not an integer")
        assert(!usedPositions.includes(slot.position), "position used twice")
        assert(!usedUnitIds.includes(slot.unit_owning_user_id), "unit_owning_user_id used twice")

        usedPositions.push(slot.position)
        usedUnitIds.push(slot.unit_owning_user_id)
        if (!allUnits.includes(slot.unit_owning_user_id)) allUnits.push(slot.unit_owning_user_id)
      }
      decks.push(deck)
    }
    assert(mainDeckId != 0, "No main deck")

    const check = await this.connection.query(`SELECT unit_owning_user_id FROM units WHERE user_id=:user AND deleted=0 AND unit_owning_user_id IN (${allUnits.join(",")})`, { user: this.user_id })
    assert(check.length === allUnits.length, "User doesn't have this cards")

    const insertDeck = []
    const insertSlot = []
    for (const deck of decks) {
      const name = deck.deck_name.replace(/['"«»]/g, "'")
      insertDeck.push(`(${this.user_id}, ${deck.unit_deck_id}, \"${name}\")`)
      for (const slot of deck.unit_deck_detail) {
        insertSlot.push(`(${this.user_id}, ${deck.unit_deck_id}, ${slot.position}, ${slot.unit_owning_user_id})`)
      }
    }

    await this.connection.query(`DELETE FROM user_unit_deck WHERE user_id = :user`, {
      user: this.user_id
    })
    await this.connection.query("INSERT INTO `user_unit_deck` (`user_id`, `unit_deck_id`, `deck_name`) VALUES " + insertDeck.join(","))
    await this.connection.query("INSERT INTO `user_unit_deck_slot` (`user_id`, `deck_id`, `slot_id`, `unit_owning_user_id`) VALUES " + insertSlot.join(","))
    await this.connection.query("UPDATE users SET main_deck=:deck WHERE user_id=:user", {
      user: this.user_id,
      deck: mainDeckId
    })

    return {
      status: 200,
      result: []
    }
  }
}
