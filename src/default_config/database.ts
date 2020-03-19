import { PoolOptions } from "mysql2"
import * as Redis from "ioredis"

export default <IDatabaseConfig>{
  mysql: {
    host: "localhost",
    user: "",
    password: "",
    database: "",
    connectionLimit: 10,
    reconnectMaxAttempt: 10,
    reconnectDelay: 5000,
  },
  redis: {
    host: "localhost",
    port: 6393,
    password: ""
  }
}

interface IDatabaseConfig {
  mysql: IMySQLConfig
  redis: Redis.RedisOptions
}
interface IMySQLConfig extends PoolOptions {
  reconnectMaxAttempt: number
  reconnectDelay: number
}
