export enum AUTH_LEVEL {
  NONE,
  BANNED,
  SESSION_EXPIRED,
  REJECTED,
  PRE_LOGIN,
  UPDATE,
  CONFIRMED_USER,
  ADMIN
}
export enum REQUEST_TYPE {
  BOTH,
  SINGLE,
  MULTI
}
export enum RESPONSE_TYPE {
  SINGLE = 1,
  MULTI
}
export enum HANDLER_TYPE {
  API,
  WEBAPI,
  WEBVIEW
}
export enum PERMISSION {
  NOXMC,
  XMC,
  STATIC
}
export enum WV_REQUEST_TYPE {
  BOTH,
  APPLICATION,
  BROWSER
}

// User
export enum FESTIVAL_SETLIST {
  ALL,
  MUSE,
  AQOURS,
  MGD
}

export const liveModsNames = ["random", "vanish", "mirror", "hp"]
export enum LiveMods {
  RANDOM = 2,
  HIDDEN = 4,
  SUDDEN = 8,
  MIRROR = 16,
  NO_FAIL = 32,
  SUDDEN_DEATH = 64
}

// warning: name order affects to the settings page
export const modificatorNames = ["random", "vanish", "mirror", "hp", "event", "cardSign"]
export const modificatorMaxValue: { [name: string]: number } = {
  event: 1,
  hp: 2,
  mirror: 1,
  vanish: 2,
  random: 1,
  cardSign: 1
}

export enum FESTIVAL_BONUS {
  GOLD_UP = 1,
  EXP_UP = 2,
  EVENT_POINT_UP = 3,
  HEAL = 4,
  SCORE_UP = 5,
  SKILL_RATE_UP = 6,
  DAMAGE_GUARD = 7,
  NO_BAD = 8,
  REWARD_GET = 9,
  REWARD_RATE_UP = 10,
  GUEST_BONUS = 11
}
