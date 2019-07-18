import Log from "./log"

// import config files
import Server from "../config/server"
import Client from "../config/client"
import Database from "../config/database"
import LBonus from "../config/lbonus"
import LLclient from "../config/LLclient"
import Modules from "../config/modules"
import I18n from "../config/i18n"

const log = new Log.Create(Server.log_level, "Config Manager");
(<any>global).logLevel = Server.log_level

export class config {
  public lbonus: typeof LBonus
  public server: typeof Server
  public client: typeof Client
  public database: typeof Database
  public modules: typeof Modules
  public llsifclient: typeof LLclient
  public i18n: typeof I18n

  public specialKey: string | Buffer = ""
  constructor() {
    this.server = Server
    this.client = Client
    this.database = Database
    this.modules = Modules
    this.llsifclient = LLclient
    this.lbonus = LBonus
    this.i18n = I18n
  }

  async prepareConfig(): Promise<void> {
    log.level = this.server.log_level

    if (this.server.debug_mode) this.server.XMC_check = false

    this.specialKey = Buffer.concat([Utils.xor(this.client.application_key.slice(0, 16), this.client.XMC_base.slice(16, 32)), Utils.xor(this.client.application_key.slice(16, 32), this.client.XMC_base.slice(0, 16))])

    if (Config.server.maintenance) {
      log.warn("Maintenance mode enabled")
    }
    if (Config.client.application_key.length != 32 && Config.server.XMC_check === true) {
      log.warn("Application key is missing. XMC verifying will be disabled")
      Config.server.XMC_check = false
    }
    if (Config.client.XMC_base.length != 32 && Config.server.XMC_check === true) {
      log.warn("Base key is missing. XMC verifying will be disabled")
      Config.server.XMC_check = false
    }

    log.info("Server version: " + Config.server.server_version)
    log.info("Сlient app version: " + Config.client.application_version)
  }

  async reloadConfig() {
    // remove modules from cache
    delete require.cache[require.resolve("../config/server")]
    delete require.cache[require.resolve("../config/client")]
    delete require.cache[require.resolve("../config/database")]
    delete require.cache[require.resolve("../config/lbonus")]
    delete require.cache[require.resolve("../config/LLclient")]
    delete require.cache[require.resolve("../config/modules")]
    delete require.cache[require.resolve("../config/i18n")]

    // and import again
    this.server = <typeof Server><unknown>(await import("../config/server")).default
    this.client = <typeof Client><unknown>(await import("../config/client")).default
    this.database = <typeof Database><unknown>(await import("../config/database")).default
    this.lbonus = <typeof LBonus><unknown>(await import("../config/lbonus")).default
    this.llsifclient = <typeof LLclient><unknown>(await import("../config/LLclient")).default
    this.modules = <typeof Modules><unknown>(await import("../config/modules")).default
    this.i18n = <typeof I18n><unknown>(await import("../config/i18n")).default

    await this.prepareConfig()
  }
}
(<any>global).Config = new config()