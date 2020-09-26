import { Utils } from "./utils"

const downloadDB = sqlite3.getDownloadSVDB()

type os = "Android" | "iOS"
export interface IUrlObject {
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

export class Download {
  public static TYPE = PACKAGE_TYPE
  public static async getUpdatePackages(os: os, clientVersion: string) {
    const packages = await downloadDB.all("SELECT url, size, version FROM update_packages WHERE version > :client AND os = :os", {
      client: clientVersion.split(".")[0],
      server: Config.server.server_version,
      os
    })
    return packages.filter(pkg => {
      return (
        Utils.versionCompare(pkg.version, Config.server.server_version) !== 1 && // exclude versions upper than server allows
        Utils.versionCompare(pkg.version, clientVersion) === 1                   // and versions lower than client have
      )
    }).sort((a, b) => {
      return Utils.versionCompare(a.version, b.version) // asc sort
    })
  }

  public static async getPackagesByType(os: os, type: number, excludedIds: number[] = []) {
    if (excludedIds.length === 0) excludedIds.push(-1)
    return await downloadDB.all(`SELECT size, url FROM packages WHERE type = :type AND id NOT IN (${excludedIds.join(",")}) AND os = :os`, {
      os,
      type
    })
  }

  public static async getPackageById(os: os, type: number, id: number, excludedIds: number[] = []) {
    if (excludedIds.length === 0) excludedIds.push(-1)
    return await downloadDB.all(`SELECT size, url FROM packages WHERE type = :type AND id NOT IN (${excludedIds.join(",")}) AND os = :os AND id = :id`, {
      os,
      type,
      id
    })
  }
}
