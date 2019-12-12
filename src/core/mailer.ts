import nodemailer from "nodemailer"
import { Logger } from "./logger"

const logger = new Logger("Mailer")
const transport = nodemailer.createTransport(Config.mailer.transportSettings)

export async function sendMail(receivers: string, subject: string, text: string) {
  if (Config.mailer.enabled === false) return false
  try {
    return await transport.sendMail({
      from: `${Config.mailer.name} ${Config.mailer.transportSettings.auth.user}`,
      to: receivers,
      subject,
      text
    })
  } catch (err) {
    logger.error(err)
    return false
  }
}
