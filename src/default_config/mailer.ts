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
  transportSettings: any // refer to nodemailer docs
  name: string
  supportMail: string
}
