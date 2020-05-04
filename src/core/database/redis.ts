import IORedis from "ioredis"
import { Logger } from "../logger"

const logger = new Logger("Redis")

export let Redis: IORedis.Redis

export async function Connect() {
  Redis = new IORedis(Config.database.redis)
  Redis.on("error", (err) => {
    logger.error(err)
  })
  await Redis.set("checkConnection", "ok", "ex", 10)
  await Redis.del("checkConnection")
}
