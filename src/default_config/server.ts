import { LEVEL } from "../core/log"

export default <Server>{
  port: 8080,
  host: "localhost",
  server_version: "39.1",
  XMC_check: false,
  debug_mode: false,
  API_request_limit: 32,
  log_level: LEVEL.INFO,
  admin_ids: [],
  PRIVATE_KEY: "",
  PUBLIC_KEY: "",
  release_info: []
}
