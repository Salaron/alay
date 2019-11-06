import { PoolConfig } from "mariadb"

export default <IDatabaseConfig>{
  debug: false,
  trace: false,
  reconnectDelay: 5000,
  reconnectMaxAttempt: 10,
  connectionLimit: 30,
  host: "localhost",
  user: "root",
  password: "",
  database: "",
  dateStrings: true
}

interface IDatabaseConfig extends PoolConfig {
  reconnectMaxAttempt: number
  reconnectDelay: number
}
