import { readdir, readFile, writeFile, stat, exists } from "fs"
import { promisify } from "util"
import { Utils } from "./utils"
import { Log } from "../core/log"
import llclient from "../core/llclient"
import moment from "moment"

const log = new Log("Download")

interface updateUrls {
  [version: string]: {
    [version2: string]: {
      url: string
      size: number
      version: string
    }[]
  }
}
export interface urlObject {
  size: number
  url: string
}
const updateUrls: updateUrls = {}
let additionalUrls: urlObject[] = []
let batchUrls: urlObject[] = []
let songUrls: urlObject[] = []

export async function init() {
  let files = (await promisify(readdir)(`${rootDir}/data/update`)).sort((a, b) =>  // sort by version
    Utils.versionCompare(a, b)
  )

  for (const file of files) {
    const split = file.split(".")
    let ext = split.pop()
    if (ext != "json") continue

    if (!updateUrls[split[0]]) updateUrls[split[0]] = {}
    updateUrls[split[0]][split[1]] = JSON.parse(await promisify(readFile)(`${rootDir}/data/update/${file}`, "utf-8"))
  }

  try {
    let a = await promisify(exists)(`${rootDir}/data/download/additional.json`)
    let stats = null
    if (a) {
      stats = await promisify(stat)(`${rootDir}/data/download/additional.json`)
    }

    if (stats && moment(new Date()).diff(stats.mtime) < 18000000 && stats.size != 0) throw new Error(`Update is not required`)
    if (Config.llsifclient.host.length === 0 || Config.llsifclient.application_key.length === 0 || Config.llsifclient.base_key.length === 0) {
      throw new Error(`External server info is not provided`)
    }
    if (Config.llsifclient.login_key.length === 0 || Config.llsifclient.login_passwd.length === 0) {
      throw new Error(`External server credentials is not provided`)
    }

    log.info(`Update additional & batch links info`)
    let { client } = await llclient.startSession({
      loginKey: Config.llsifclient.login_key,
      loginPasswd: Config.llsifclient.login_passwd,
      host: Config.llsifclient.host,
      applicationKey: Config.llsifclient.application_key,
      baseKey: Config.llsifclient.base_key,
      logLevel: Config.server.log_level,
      bundleVersion: Config.llsifclient.bundle_version,
      clientVersion: Config.llsifclient.client_version,
      publicKey: Config.llsifclient.public_key,
      logger: log
    })

    let additional = await client.APIsingleRequest({
      module: "download", action: "additional", additional: ["mgd", "commandNum", "timeStamp"], formData: {
        package_type: 0,
        target_os: "Android",
        package_id: 0
      }
    })
    let batch = await client.APIsingleRequest({
      url: "/main.php/download/batch", additional: ["commandNum"], formData: {
        package_type: 0,
        client_version: Config.server.server_version,
        os: "Android",
        excluded_package_ids: []
      }
    })

    await promisify(writeFile)(`${rootDir}/data/download/additional.json`, JSON.stringify(additional))
    await promisify(writeFile)(`${rootDir}/data/download/batch.json`, JSON.stringify(batch))
  } catch (err) {
    log.warn(err)
  }

  try {
    additionalUrls = JSON.parse(await promisify(readFile)(`${rootDir}/data/download/additional.json`, "utf-8")).response_data
    batchUrls = JSON.parse(await promisify(readFile)(`${rootDir}/data/download/batch.json`, "utf-8")).response_data
    songUrls = JSON.parse(await promisify(readFile)(`${rootDir}/data/download/songs.json`, "utf-8")).response_data
  } catch (err) {
    log.warn(err)
  } // tslint:disable-line

}
(async () => {
  setInterval(() => { init() }, 19800000) // 5 hours 30 mins
})()

export class Download {
  public static getUpdateLinks() {
    return updateUrls
  }

  public static getAdditional() {
    return additionalUrls
  }

  public static getBatch() {
    return batchUrls
  }

  public static getSong() {
    return songUrls
  }
}
