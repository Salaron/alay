import { readFile } from "fs"
import moment from "moment"
import { promisify } from "util"
import { WebView } from "../../../common/webview"
import RequestData from "../../../core/requestData"
import { AUTH_LEVEL, WV_REQUEST_TYPE } from "../../../models/constant"

export default class extends WebViewAction {
  public requestType: WV_REQUEST_TYPE = WV_REQUEST_TYPE.BOTH
  public requiredAuthLevel: AUTH_LEVEL = AUTH_LEVEL.CONFIRMED_USER

  constructor(requestData: RequestData) {
    super(requestData)
  }

  public async execute() {
    const code = await this.i18n.getUserLocalizationCode(this.user_id)
    const [strings, template, currentOnline] = await Promise.all([
      this.i18n.getStrings(code, "server-info"),
      WebView.getTemplate("server", "info"),
      this.webview.getCurrentOnline()
    ])

    const serverInfo = {
      branch: "Unknown",
      commit: "Unknown",
      commitDate: "Unknown",
      clientVersion: Config.server.server_version,
      bundleVersion: this.requestData.request.headers["bundle-version"] ? this.requestData.request.headers["bundle-version"] : "Unknown",
      uptime: moment.duration(0 - Math.ceil(process.uptime()), "seconds").locale(code).humanize(true),
      supportMail: Config.mailer.supportMail.length > 0 ? Config.mailer.supportMail : null,
      currentOnline
    }
    try {
      // get git info lol
      const branchInfo = (await promisify(readFile)(`${rootDir}/.git/HEAD`, "utf-8")).substring(5).replace(/\n/g, "")
      const log = (await promisify(readFile)(`${rootDir}/.git/logs/${branchInfo}`, "utf-8")).split(/\n/)
      const lastCommit = log[log.length - 2].split(/\t|\s/g)
      serverInfo.branch = branchInfo.split("/")[2]
      serverInfo.commit = lastCommit[1].substring(0, 7)
      serverInfo.commitDate = moment(parseInt(lastCommit[4]) * 1000).format("YYYY-MM-DD HH:mm") + " " + lastCommit[5]
    } catch (_) { } // tslint:disable-line

    return {
      status: 200,
      result: await this.webview.compileBodyTemplate(template, this.requestData, {
        i18n: strings,
        serverInfo
      })
    }
  }
}
