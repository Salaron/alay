import { LEVEL } from "../core/log"

export default <Server>{
  port: 8080,
  host: "localhost",
  maintenance: false,
  server_version: "38.1",
  XMC_check: false,
  debug_mode: false,
  API_request_limit: 32,
  log_level: LEVEL.INFO,
  admin_ids: [],
  admin_pass: "",
  PRIVATE_KEY: "",
  PUBLIC_KEY: "",
  release_info: []
}