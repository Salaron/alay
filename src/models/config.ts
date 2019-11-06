interface IClientConfig {
  application_version: string
  application_id: string
  application_key: string
  XMC_base: string
  consumer_key: string
}
interface IDatabaseConfig {
  autoReconnect: boolean
  autoReconnectDelay: number
  autoReconnectMaxAttempt: number
  connectionLimit: number
  dateStrings: boolean
  host: string
  user: string
  port?: number
  password: string
  database?: string
}
interface II18nConfig {
  languages: ILangCodes
  defaultLanguage: string
}
interface ILangCodes {
  [langName: string]: string
}

interface ILBonusConfig {
  calendar_generator: {
    cards_query: string
    card_limit: number
    special_flag_types: number[]
    items: item[]
  }
  total_login_bonus: {
    [day: string]: {
      name: string
      amount: number
      item_id?: number
    }
  }
}
type itemName = "loveca" | "bt_ticket" | "green_ticket" | "game_coin" | "friend_pts" | "unit" | "exchange_point" | "sis"
type item = {
  name: itemName
  item_id?: number
  min_amount: number
  max_amount: number
} | {
  name: itemName
  item_id?: number
  amount: number[]
} | {
  name: itemName
  item_id?: number
  amount: number
}

interface ILLclient {
  host: string
  application_key: string
  base_key: string
  login_key: string
  login_passwd: string
  client_version: string
  bundle_version: string
  public_key: string
  links_from_prod_server: boolean
}

interface IModules {
  award: {
    unlockAll: boolean
  }
  background: {
    unlockAll: boolean
  }
  download: {
    microDLurl: string
  }
  live: {
    unlockAll: boolean
    continueAttemptsCount: number
  }
  liveSe: {
    list: number[]
  }
  liveIcon: {
    list: number[]
  }
  login: {
    auth_logging: boolean
    webview_login: boolean
    enable_registration: boolean
    enable_recaptcha: boolean
    recaptcha_site_key: string
    recaptcha_private_key: string
  }
  personalNotice: {
    welcomeMessageEnabled: boolean
    welcomeMessageType: number
    welcomeMessageTitle: string
    welcomeMessageContents: string
  }
  festival: {
    max_reset_setlist: number
    reset_cost_type: number
    reset_cost_value: number
  }
  unit: {
    removeFromDatabase: boolean
  }
  unitSelect: {
    museCenterUnits: number[]
    aqoursCenterUnits: number[]
  }
  user: {
    setBirthOnlyOnce: boolean
    userSessionExpire: number
  }
}

interface IServerConfig {
  port: number
  host: string
  server_version: string
  XMC_check: boolean
  API_request_limit: number
  log_level: import("../core/log").LEVEL // https://stackoverflow.com/questions/39040108/import-class-in-definition-file-d-ts
  debug_mode: boolean
  admin_ids: number[]
  PRIVATE_KEY: string
  PUBLIC_KEY: string
  release_info: IReleaseInfo[]
}
interface IReleaseInfo {
  key: string
  id: number
}

interface IMantenanceConfig {
  force_enabled: boolean
  notice: boolean
  start_date: string
  end_date: string
  time_zone: number
  bypass: number[]
}

interface IMailerConfig {
  enabled: boolean
  transportSettings: import("nodemailer").TransportOptions
  name: string
  supportMail: string
}