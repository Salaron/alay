import { readdir, readFile } from "fs"
import { promisify } from "util"

interface updateUrls {
  [version: string]: {
    [version2: string]: {
      url: string
      size: number
      version: string
    }[]
  }
}
let updateUrls: updateUrls = {}

export async function init() {
  let files = await promisify(readdir)(rootDir + "/data/update/")
  files.map((f: string) => // remove extension
    f.split(".").slice(0, -1).join(".")
  ).sort((a, b) =>  // sort by version
    Utils.versionCompare(a, b)
  )
  for (let i = 0; i < files.length; i++) {
    let file = files[i].split(".")
    if (!updateUrls[file[0]]) updateUrls[file[0]] = {}
    updateUrls[file[0]][file[1]] = JSON.parse(await promisify(readFile)(rootDir + "/data/update/" + files[i], "utf-8"))
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
(global as any).Download = Download