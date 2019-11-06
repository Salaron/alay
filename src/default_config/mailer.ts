import { TransportOptions } from "nodemailer"

export default <IMailerConfig>{
  enabled: false,
  transportSettings: {
    service: "Yandex",
    auth: {
      user: "",
      pass: ""
    }
  },
  name: "SunLight Project",
  supportMail: ""
}

interface IMailerConfig {
  enabled: boolean
  transportSettings: TransportOptions
  name: string
  supportMail: string
}
