import readline from "readline"
import Log from "./log"

const log = new Log.Create(logLevel, "ReadLine")
const readLineInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

export default function initReadLine() {
  readLineInterface.question("", async(answer) => {
    initReadLine()
    if (answer == "" || answer == "r") {
      process.exit(0)
    }

    let command = answer.match(/(?=\S)[^"\s]*(?:"[^\\"]*(?:\\[\s\S][^\\"]*)*"[^"\s]*)*/g)
    if (!command) return
    for (let i = 0; i < command.length; i++) {
      if (command[i].startsWith("\"") && command[i].endsWith("\"")) {
        command[i] = command[i].substr(1, command[i].length - 2)
      }
    }

    let f: any = command.shift()
    if (typeof (<any>commands)[f] != "function") return log.warn("Invalid Command");
    (<any>commands)[f].apply(null, command)
  })
}

const commands = {
  connectionDebug: async function() {
    try {
      MySQLconnectionPool.connectionDebug(arguments[0])
    } catch (err) {
      log.error(err)
    }
  },
  reloadConfig: async function() {
    try {
      await Config.reloadConfig()
    } catch (err) {
      log.error(err)
    }
  },
  exit: async function() {
    process.exit(0)
  }
}
