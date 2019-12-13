import { IConfig } from "gris"

export default <IGrisConfig>{
  enabled: false,
  loginKey: "",
  loginPasswd: "",
  publicKey: "",
  baseKey: "",
  applicationKey: ""
}

interface IGrisConfig extends IConfig {
  enabled: boolean
}
