import { TYPE } from "../../../common/type"
import { Utils } from "../../../common/utils"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL } from "../../../models/constant"
import { ErrorWebAPI } from "../../../models/error"

export default class extends WebApiAction {
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public paramTypes() {
    return {
      rarity: TYPE.INT,
      password: TYPE.STRING
    }
  }
  public paramCheck() {
    if (this.params.rarity < 1 || this.params.rarity > 5) throw new ErrorWebAPI("nope")
  }

  public async execute() {
    const strings = await this.i18n.getStrings(this.requestData, "login-startup", "settings-index")

    const password = Utils.xor(Buffer.from(Utils.RSADecrypt(this.params.password), "base64").toString(), this.requestData.auth_token).toString()
    if (!Utils.checkPasswordFormat(password)) throw new ErrorWebAPI(strings.passwordIncorrect)

    const userData = await this.connection.first("SELECT user_id FROM users WHERE user_id = :user AND password = :pass", {
      user: this.user_id,
      pass: password
    })
    if (!userData) throw new ErrorWebAPI(strings.passwordNotValid)

    let deckData = (await this.connection.query(`
    SELECT
      unit_owning_user_id
    FROM
      user_unit_deck_slot
    JOIN users
      ON users.user_id = user_unit_deck_slot.user_id
      AND users.main_deck = user_unit_deck_slot.deck_id
    WHERE users.user_id = :user`, { user: this.user_id })).map(unit => unit.unit_owning_user_id)
    if (deckData.length === 0) deckData = [0] // impossible but anyway...

    let patherUnit = (await this.connection.first("SELECT partner_unit FROM users WHERE user_id = :user", {
      user: this.user_id
    })).partner_unit || 0

    let res = await this.connection.execute(`
    DELETE FROM units
    WHERE
    units.favorite_flag = 0
    AND units.deleted = 0
    AND units.unit_id IN (${this.unit.rarityUnits[this.params.rarity].join(",")})
    AND units.unit_owning_user_id NOT IN (${deckData.join(",")}, ${patherUnit})
    AND user_id = :user`, {
      user: this.user_id
    })
    if (this.params.rarity != 1) {
      await this.item.addItemToUser(this.user_id, {
        name: "exchange_point",
        id: this.params.rarity
      }, res.affectedRows)
    } else {
      res.affectedRows = 0 // n
    }

    return {
      status: 200,
      result: Utils.prepareTemplate(strings.sealPointsGained, {
        points: res.affectedRows
      })
    }
  }
}
