import nodemailer from "nodemailer"
import { Log } from "./log"

const log = new Log("Mailer")
export class Mailer {
  public available = false
  private transporter: nodemailer.Transporter
  constructor() {
    if (Config.mailer.enabled) {
      this.connect()
    }
  }

  public static getInstance() {
    return mailer
  }

  public async sendMail(receivers: string, subject: string, text: string) {
    if (this.available === false) return false
    try {
      const result = await this.transporter.sendMail({
        from: `${Config.mailer.name} ${(<any>Config.mailer.transportSettings).auth.user}`,
        to: receivers,
        subject,
        text
      })
      return result
    } catch (err) {
      log.error(err)
      return false
    }
  }
  public reconnect() {
    this.transporter.close()
    this.available = false
    this.connect()
  }

  private connect() {
    try {
      this.transporter = nodemailer.createTransport(Config.mailer.transportSettings)
      this.available = true
    } catch (err) {
      log.error(err)
      return false
    }
  }
}
const mailer = new Mailer()
