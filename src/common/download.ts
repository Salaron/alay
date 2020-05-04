import { Logger } from "../core/logger"
import { Utils } from "./utils"

const logger = new Logger("Download")
const downloadDB = sqlite3.getDownloadSVDB()

type os = "Android" | "iOS"
export interface urlObject {
  size: number
  url: string
}

export enum PACKAGE_TYPE {
  BOOTSTRAP = 0,
  LIVE = 1,
  SCENARIO = 2,
  SUBSCENARIO = 3,
  MICRO = 4,
  EVENT_SCENARIO = 5,
  MULTI_UNIT_SCENARIO = 6,

  SUNLIGHT_LIVE = 100
}

let additionalUrls: urlObject[] = []
let batchUrls: urlObject[] = []

export class Download {
  public static TYPE = PACKAGE_TYPE
  public static async getUpdatePackages(os: os, clientVersion: string) {
    let packages = await downloadDB.all("SELECT url, size, version FROM update_packages WHERE version > :client AND os = :os", {
      client: clientVersion.split(".")[0],
      server: Config.server.server_version,
      os
    })
    return packages = packages.filter(pkg => {
      return (
        Utils.versionCompare(pkg.version, Config.server.server_version) !== 1 && // exclude versions upper than server allows
        Utils.versionCompare(pkg.version, clientVersion) === 1                   // and versions lower than client have
      )
    }).sort((a, b) => {
      return Utils.versionCompare(a.version, b.version) // asc sort
    })
  }

  public static getAdditional() {
    return additionalUrls
  }

  public static getBatch() {
    return batchUrls
  }

  public static async getPackagesByType(os: os, type: number, excludedIds: number[] = [], targetId?: number) {
    if (excludedIds.length === 0) excludedIds.push(0)
    const packages = await downloadDB.all(`SELECT size, url FROM packages WHERE type = :type AND id NOT IN (${excludedIds.join(",")}) AND os = :os ${targetId ? "AND id = :targetId" : ""}`, {
      os,
      type,
      targetId
    })
    return packages
  }
}
