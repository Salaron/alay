import Log from "../core/log"

export default <Server>{
  port: 8080,
  host: "localhost",
  maintenance: false,
  bypass_maintenance: [],
  server_version: "38.1",
  XMC_check: false,
  debug_mode: false,
  API_request_limit: 32,
  log_level: Log.LEVEL.INFO,
  admin_ids: [],
  admin_pass: "",
  PRIVATE_KEY: "",
  PUBLIC_KEY: "",
  request_logging: false,
  release_info: []
}

interface Server {
  port: number
  host: string
  maintenance: boolean
  bypass_maintenance: number[]
  server_version: string
  XMC_check: boolean
  API_request_limit: number
  log_level: Log.LEVEL
  debug_mode: boolean
  admin_ids: number[]
  admin_pass: string
  PRIVATE_KEY: string
  PUBLIC_KEY: string
  release_info: ReleaseInfo[]
  request_logging: boolean
}
interface ReleaseInfo {
  key: string
  id: number
}