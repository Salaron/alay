import { createLogger, format, transports, Logger as IWinstonLogger, LeveledLogMethod, addColors, LogEntry } from "winston"

interface ILogger extends IWinstonLogger {
  fatal: LeveledLogMethod
  always: LeveledLogMethod
}

export function updateLevelForAllLoggers(level: LEVEL) {
  registedLoggers.forEach(logger => {
    logger.setLevel(level)
  })
}
export enum LEVEL {
  ALWAYS = 1,
  FATAL,
  ERROR,
  WARN,
  INFO,
  DEBUG,
  VERBOSE
}

const labelSize = 16
const customLevels = {
  levels: {
    always: 0,
    fatal: 1,
    error: 2,
    warn: 3,
    info: 4,
    debug: 5,
    verbose: 6
  },
  colors: {
    always: "white",
    fatal: "redBG white",
    error: "magentaBG white",
    warn: "yellowBG black",
    info: "whiteBG black",
    debug: "cyanBG black",
    verbose: "blackBG gray"
  }
}

function convertLevelToWinston(level: LEVEL): string {
  return LEVEL[level].toLowerCase()
}

type Message = any[] | number | string | boolean | null | undefined | Error | object
const registedLoggers: Logger[] = []
export class Logger {
  public label: string
  private winston: ILogger
  private labelWinston: string

  constructor(label: string) {
    this.label = this.labelWinston = label
    this.winston = <ILogger>createLogger({
      level: convertLevelToWinston(Config.server.log_level),
      levels: customLevels.levels,
      format: format.combine(
        format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss"
        }),
        format.splat(),
        format.errors({ stack: true }),
        format.printf(info => {
          const message = info.stack ? info.stack : typeof info.message === "object" ? JSON.stringify(info.message) : info.message
          return `${info.timestamp} - [${info.level}] ${this.labelWinston}: ${message}`
        })
      ),
      transports: [
        new transports.File({
          filename: "logs/out.log",
          level: "info"
        }),
        new transports.File({
          filename: "logs/error.log",
          level: "warn"
        }),
        new transports.Console({
          format: format.combine(
            format.timestamp({
              format: "HH:mm:ss"
            }),
            format.simple(),
            format.printf(info => {
              while (this.labelWinston.length < labelSize) this.labelWinston = " " + this.labelWinston
              const message = info.stack ? info.stack : typeof info.message === "object" ? JSON.stringify(info.message) : info.message
              return format.colorize().colorize(info.level, ` [${info.timestamp}] ${this.labelWinston} `) + " " + message
            })
          )
        })
      ]
    })
    addColors(customLevels.colors)
    registedLoggers.push(this)
  }

  public setLevel(level: LEVEL) {
    this.winston.level = convertLevelToWinston(level)
  }

  public fatal(message: Message, label?: string) {
    this.labelWinston = label || this.label
    this.winston.fatal(<string>message)
  }
  public error(message: Message, label?: string) {
    this.labelWinston = label || this.label
    this.winston.error(<string>message)
  }
  public warn(message: Message, label?: string) {
    this.labelWinston = label || this.label
    this.winston.warn(<string>message)
  }
  public info(message: Message, label?: string) {
    this.labelWinston = label || this.label
    this.winston.info(<string>message)
  }
  public debug(message: Message, label?: string) {
    this.labelWinston = label || this.label
    this.winston.debug(<string>message)
  }
  public verbose(message: Message, label?: string) {
    this.labelWinston = label || this.label
    this.winston.verbose(<string>message)
  }
  public always(message: Message, label?: string) {
    this.labelWinston = label || this.label
    this.winston.always(<string>message)
  }

  public profile(id: string, meta?: LogEntry) {
    this.winston.profile(id, meta)
  }
}
