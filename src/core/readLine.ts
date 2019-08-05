import readline from "readline"
import { Log } from "./log"

const log = new Log("ReadLine")
const readLineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

let _showInitMessage = true
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

    let command = answer.match(/(?=\S)[^"\s]*(?:"[^\\"]*(?:\\[\s\S][^\\"]*)*"[^"\s]*)*/g)
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
    execute: async function () {
      try {
        if (arguments.length < 2) throw new Error("Not Enough Arguments")
        let args = []
        let useNumber = false
        if (arguments[1].startsWith("n")) {
          useNumber = true
          arguments[1] = arguments[1].substr(1)
        }
        const connection = await MySQLconnection.get()
        const unit = new Unit(connection)

        for (let i = 0; i < arguments.length; i++) {
          if (isNaN(arguments[i])) throw new Error("'" + arguments[i] + "' is not a number")
          args.push(parseInt(arguments[i]))
        }

        let res = await unit.addUnit(args[0], args[1], {
          amount: args[2] || 1,
          level: args[3]  || 1,
          rank: args[4]   || 1,
          love: args[5]   || 0,
          useNumber: useNumber
        })
        await connection.commit()
        log.always("Done! Unit owning user id: " + res.unit_owning_user_id, "addUnit")
      } catch (err) {
        log.error(err.message)
        log.always("addUnit user_id: int [n]unit_id: int [amount: int] [rank: 1 | 2] [level: int] [love: int]", "Command Usage")
        log.always("                      ^ prefix with 'n' to use unit_number", "Command Usage")
      }
    },
    help: function () {
      log.always("addUnit user_id: int [n]unit_id: int [amount: int] [rank: 1 | 2] [level: int] [love: int]", "Command Usage")
      log.always("                      ^ prefix with 'n' to use unit_number", "Command Usage")
      log.always("  Adds a specific card to the user", "Command Usage")
    }
  },
  connectiondebug: {
    execute: async function () {
      try {
        MySQLconnectionPool.connectionDebug(arguments[0])
      } catch (err) {
        log.error(err)
      }
    },
    help: function () {
      log.always("connectionDebug [interval: ms]", "Command Usage")
      log.always("  Print some debug info to the stdout", "Command Usage")
      log.always("  Note: log level should be >= DEBUG", "Command Usage")
    }
  },
  reloadconfig: {
    execute: async function () {
      try {
        await Config.reloadConfig()
      } catch (err) {
        log.error(err)
      }
    },
    help: function () {
      log.always("reloadConfig", "Command Usage")
      log.always("  Reload server config", "Command Usage")
      log.always("  No arguments needed", "Command Usage")
    }
  },
  help: {
    execute: async function () {
      try {
        for (const command of Object.values(commands)) {
          if (command.help) command.help()
        }
      } catch (err) {
        log.error(err.message)
      }
    },
    help: function () {
      log.always("help", "Command Usage")
      log.always("  Show this message", "Command Usage")
    }
  },
  exit: {
    execute: async function () {
      process.exit(0)
    },
    help: function () {
      log.always("exit", "Command Usage")
      log.always("  Shutdown the server", "Command Usage")
    }
  }
}

interface CommandInterface {
  [command: string]: {
    execute(): Promise<void>
    help?: Function
  }
}