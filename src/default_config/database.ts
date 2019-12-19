import { PoolOptions } from "mysql2"

export default <IDatabaseConfig>{
  host: "localhost",
  user: "",
  password: "",
  database: "",
  connectionLimit: 10,
  reconnectMaxAttempt: 10,
  reconnectDelay: 5000,
}

interface IDatabaseConfig extends PoolOptions {
  reconnectMaxAttempt: number
  reconnectDelay: number
}
