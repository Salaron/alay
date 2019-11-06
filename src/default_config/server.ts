import { LEVEL } from "../core/log"

export default <IServerConfig>{
  port: 8080,
  host: "localhost",
  server_version: "40.7",
  XMC_check: false,
  debug_mode: false,
  API_request_limit: 32,
  log_level: LEVEL.INFO,
  admin_ids: [],
  PUBLIC_KEY: "",
  PRIVATE_KEY: "",
  release_info: []
}

interface IServerConfig {
  port: number
  host: string
  server_version: string
  XMC_check: boolean
  API_request_limit: number
  log_level: LEVEL
  debug_mode: boolean
  admin_ids: number[]
  PRIVATE_KEY: string
  PUBLIC_KEY: string
  release_info: Array<{
    key: string
    id: number
  }>
}
