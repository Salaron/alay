import { exists, readFile, stat, writeFile } from "fs"
import moment from "moment"
import { promisify } from "util"
import { Logger } from "../core/logger"
import { Utils } from "./utils"

const log = new Logger("Download")
const downloadDB = sqlite3.getDownload()

type os = "Android" | "iOS"
export interface urlObject {
  size: number
  url: string
}

let additionalUrls: urlObject[] = []
let batchUrls: urlObject[] = []

export async function init() {
  try {
    additionalUrls = JSON.parse(await promisify(readFile)(`${rootDir}/data/download/additional.json`, "utf-8")).response_data
    batchUrls = JSON.parse(await promisify(readFile)(`${rootDir}/data/download/batch.json`, "utf-8")).response_data
  } catch (err) {
    log.warn(err)
  }
}

export class Download {
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

  public static async getSongPackages(os: os, excludedIds: number[]) {
    if (excludedIds.length === 0) excludedIds.push(0)
    const packages = await downloadDB.all(`SELECT size, url FROM packages WHERE type = 1 AND id NOT IN (${excludedIds.join(",")}) AND os = :os`, {
      os
    })
    return packages
  }
}
