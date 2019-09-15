import { readdir, readFile } from "fs"
import { promisify } from "util"
import { Utils } from "./utils"

interface updateUrls {
  [version: string]: {
    [version2: string]: {
      url: string
      size: number
      version: string
    }[]
  }
}
const updateUrls: updateUrls = {}

export async function init() {
  const files = await promisify(readdir)(rootDir + "/data/update/")
  files.map((f: string) => // remove extension
    f.split(".").slice(0, -1).join(".")
  ).sort((a, b) =>  // sort by version
    Utils.versionCompare(a, b)
  )
  for (const file of files) {
    const fileNameSplit = file.split(".")
    if (!updateUrls[fileNameSplit[0]]) updateUrls[fileNameSplit[0]] = {}
    updateUrls[fileNameSplit[0]][fileNameSplit[1]] = JSON.parse(await promisify(readFile)(rootDir + "/data/update/" + file, "utf-8"))
  }
}
(async () => {
  setInterval(() => { init() }, 19800000) // 5 hours 30 mins
})()

export class Download {
  public static getUpdateLinks() {
    return updateUrls
  }
}
