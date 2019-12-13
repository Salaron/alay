import { Logger, updateLevelForAllLoggers } from "./logger"

// import config files
import Server from "../config/server"
import Client from "../config/client"
import Database from "../config/database"
import LBonus from "../config/lbonus"
import Modules from "../config/modules"
import I18n from "../config/i18n"
import Maintenance from "../config/maintenance"
import Mailer from "../config/mailer"
import Gris from "../config/gris"

export class config {
  public lbonus: typeof LBonus
  public server: typeof Server
  public client: typeof Client
  public database: typeof Database
  public modules: typeof Modules
  public i18n: typeof I18n
  public maintenance: typeof Maintenance
  public mailer: typeof Mailer
  public gris: typeof Gris

  public specialKey: string | Buffer = ""
  constructor() {
    this.server = Server
    this.client = Client
    this.database = Database
    this.modules = Modules
    this.lbonus = LBonus
    this.i18n = I18n
    this.maintenance = Maintenance
    this.mailer = Mailer
    this.gris = Gris
  }

  public async prepareConfig(): Promise<void> {
    const log = new Logger("Config")
    const Utils = (await import("../common/utils")).Utils
    if (this.server.debug_mode) this.server.XMC_check = false

    this.specialKey = Buffer.concat([Utils.xor(this.client.application_key.slice(0, 16), this.client.XMC_base.slice(16, 32)), Utils.xor(this.client.application_key.slice(16, 32), this.client.XMC_base.slice(0, 16))])

    if (Config.maintenance.force_enabled) log.warn("Maintenance mode enabled")
    if (Config.client.application_key.length != 32 && Config.server.XMC_check === true) {
      log.warn("Application key is missing. XMC verifying will be disabled")
      Config.server.XMC_check = false
    }
    if (Config.client.XMC_base.length != 32 && Config.server.XMC_check === true) {
      log.warn("Base key is missing. XMC verifying will be disabled")
      Config.server.XMC_check = false
    }
    if (Config.server.PRIVATE_KEY.length < 31) throw new Error(`RSA Private key is not configured`)
    if (Config.server.PUBLIC_KEY.length < 26) throw new Error(`RSA Public key is not configured`)

    log.info("Server version: " + Config.server.server_version)
    log.info("Bundle version: " + Config.client.application_version)
  }

  public async reloadConfig() {
    // remove modules from cache
    delete require.cache[require.resolve("../config/server")]
    delete require.cache[require.resolve("../config/client")]
    delete require.cache[require.resolve("../config/database")]
    delete require.cache[require.resolve("../config/lbonus")]
    delete require.cache[require.resolve("../config/modules")]
    delete require.cache[require.resolve("../config/i18n")]
    delete require.cache[require.resolve("../config/maintenance")]
    delete require.cache[require.resolve("../config/mailer")]
    delete require.cache[require.resolve("../config/gris")]

    // and import again
    this.server = <typeof Server><unknown>(await import("../config/server")).default
    this.client = <typeof Client><unknown>(await import("../config/client")).default
    this.database = <typeof Database><unknown>(await import("../config/database")).default
    this.lbonus = <typeof LBonus><unknown>(await import("../config/lbonus")).default
    this.modules = <typeof Modules><unknown>(await import("../config/modules")).default
    this.i18n = <typeof I18n><unknown>(await import("../config/i18n")).default
    this.maintenance = <typeof Maintenance><unknown>(await import("../config/maintenance")).default
    this.mailer = <typeof Mailer><unknown>(await import("../config/mailer")).default
    this.gris = <typeof Gris><unknown>(await import("../config/gris")).default

    await this.prepareConfig()
    updateLevelForAllLoggers(Config.server.log_level)
  }
}
(<any>global).Config = new config()
