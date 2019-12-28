import { PoolConfig } from "mysql"

export default <IDatabaseConfig>{
  host: "localhost",
  user: "",
  password: "",
  database: "",
  connectionLimit: 10,
  reconnectMaxAttempt: 10,
  reconnectDelay: 5000,
}

interface IDatabaseConfig extends PoolConfig {
  reconnectMaxAttempt: number
  reconnectDelay: number
}
