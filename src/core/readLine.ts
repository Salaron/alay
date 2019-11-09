import readline from "readline"
import { Connection } from "./database/mariadb"
import { Log } from "./log"
import { Unit } from "../common/unit"

const log = new Log("ReadLine")
const readLineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let _showInitMessage = true // tslint:disable-line
export default function initReadLine() {
  if (_showInitMessage) {
    log.info("Type 'help' for help")
    _showInitMessage = false
  }
  readLineInterface.question("", async (answer) => {
    initReadLine()
    if (answer == "" || answer == "r") {
      process.exit(0)
    }

    const command = answer.match(/(?=\S)[^"\s]*(?:"[^\\"]*(?:\\[\s\S][^\\"]*)*"[^"\s]*)*/g)
    if (!command || command.length === 0) return
    for (let i = 0; i < command.length; i++) {
      if (command[i].startsWith("\"") && command[i].endsWith("\"")) {
        command[i] = command[i].substr(1, command[i].length - 2)
      }
    }

    let com = command.shift()
    if (!com) return log.warn("Invalid Command")
    com = com.toLowerCase()
    if (!(commands)[com] || typeof commands[com].execute != "function") return log.warn("Invalid Command")
    commands[com].execute.apply(null, command as [])
  })
}

const commands: CommandInterface = {
  addunit: {
    async execute() {
      try {
        if (arguments.length < 2) throw new Error("Not Enough Arguments")
        const args = []
        let useNumber = false
        if (arguments[1].startsWith("n")) {
          useNumber = true
          arguments[1] = arguments[1].substr(1)
        }
        const connection = await Connection.beginTransaction()
        // @ts-ignore
        const unit = new Unit({
          connection
        })

        for (const arg of arguments) {
          if (isNaN(arg)) throw new Error("'" + arg + "' is not a number")
          args.push(parseInt(arg))
        }

        const res = await unit.addUnit(args[0], args[1], {
          amount: args[2] || 1,
          level: args[3] || 1,
          rank: args[4] || 1,
          love: args[5] || 0,
          useNumber
        })
        await connection.commit(true)
        log.always("Done! Unit owning user id: " + res.unit_owning_user_id, "addUnit")
      } catch (err) {
        log.error(err.message)
        log.always("addUnit user_id: int [n]unit_id: int [amount: int] [rank: 1 | 2] [level: int] [love: int]", "Command Usage")
        log.always("                      ^ prefix with 'n' to use unit_number", "Command Usage")
      }
    },
    help() {
      log.always("addUnit user_id: int [n]unit_id: int [amount: int] [rank: 1 | 2] [level: int] [love: int]", "Command Usage")
      log.always("                      ^ prefix with 'n' to use unit_number", "Command Usage")
      log.always("  Adds a specific card to the user", "Command Usage")
    }
  },
  reloadconfig: {
    async execute() {
      try {
        await Config.reloadConfig()
      } catch (err) {
        log.error(err)
      }
    },
    help() {
      log.always("reloadConfig", "Command Usage")
      log.always("  Reload server config", "Command Usage")
    }
  },
  help: {
    async execute() {
      try {
        for (const command of Object.values(commands)) {
          if (command.help) command.help()
        }
      } catch (err) {
        log.error(err.message)
      }
    },
    help() {
      log.always("help", "Command Usage")
      log.always("  Show this message", "Command Usage")
    }
  },
  exit: {
    async execute() {
      process.exit(0)
    },
    help() {
      log.always("exit", "Command Usage")
      log.always("  Shutdown the server", "Command Usage")
    }
  }
}

interface CommandInterface {
  [command: string]: {
    execute(): Promise<void>
    help?: () => void
  }
}
