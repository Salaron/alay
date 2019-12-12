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

export const settingNames = ["event", "hp", "mirror", "vanish", "random"]
export const settingValues: { [name: string]: number } = {
  event: 1,
  hp: 2,
  mirror: 1,
  vanish: 2,
  random: 1
}
