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