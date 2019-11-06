// based on Caraxian.log
import Chalk from "chalk"
import { stringify } from "flatted"
import extend from "extend"
import { appendFile } from "fs"
import { EOL } from "os"
import util from "util"

const toTitleCase = (str: string) => str.replace(/\w\S*/g, (txt: string) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
const defLabelSize = 16

export enum LEVEL {
  ALWAYS = 1,
  FATAL,
  ERROR,
  WARN,
  INFO,
  DEBUG,
  VERBOSE
}

export class Log {
  public options: CreateOptions

  constructor(defaultLabel?: string | CreateOptions, options?: Partial<CreateOptions>) {
    if (typeof defaultLabel != "string" && typeof defaultLabel === "object") options = defaultLabel
    if (typeof options === "undefined") options = { labelSize: defLabelSize, defaultLabel: <string | undefined>defaultLabel }
    if (typeof options.labelSize != "number") options.labelSize = defLabelSize
    if (typeof options.showTime != "boolean") options.showTime = true
    if (typeof options.defaultLabel === "undefined" && typeof defaultLabel === "string") options.defaultLabel = defaultLabel

    const defOptions = {
      labelSize: defLabelSize,
      label: {
        fatal: new Label(options.defaultLabel || "[FATAL]", options.labelSize, "red", "white"),
        error: new Label(options.defaultLabel || "[ERROR]", options.labelSize, "magenta", "white"),
        warn: new Label(options.defaultLabel || "[WARN]", options.labelSize, "yellow", "black"),
        info: new Label(options.defaultLabel || "[INFO]", options.labelSize, "white", "black"),
        debug: new Label(options.defaultLabel || "[DEBUG]", options.labelSize, "cyan", "black"),
        verbose: new Label(options.defaultLabel || "[VERBOSE]", options.labelSize, "black", "gray"),
        always: new Label(options.defaultLabel || "[LOG]", options.labelSize, "black", "white")
      },
      output: [
        new Output(process.stdout, process.stdout.write, true, false)
      ]
    }

    this.options = <CreateOptions>extend(true, {}, defOptions, options)
  }

  public verbose(message: any, label: Label | string = this.options.label.verbose) {
    if (typeof label === "string")
      label = new Label(label, this.options.label.verbose.size, this.options.label.verbose.color)
    if (Config.server.log_level >= LEVEL.VERBOSE)
      this.writeOutput(label, message)
  }
  public debug(message: any, label: Label | string = this.options.label.debug) {
    if (typeof label === "string")
      label = new Label(label, this.options.label.debug.size, this.options.label.debug.color)
    if (Config.server.log_level >= LEVEL.DEBUG)
      this.writeOutput(label, message)
  }
  public info(message: any, label: Label | string = this.options.label.info) {
    if (typeof label === "string")
      label = new Label(label, this.options.label.info.size, this.options.label.info.color)
    if (Config.server.log_level >= LEVEL.INFO)
      this.writeOutput(label, message)
  }
  public async warn(message: any, label: Label | string = this.options.label.warn) {
    if (typeof label === "string")
      label = new Label(label, this.options.label.warn.size, this.options.label.warn.color)
    if (Config.server.log_level >= LEVEL.WARN) {
      this.writeOutput(label, message)
      await util.promisify(appendFile)(`${rootDir}/logs/warn.log`, `\n[${new Date().toLocaleTimeString()}] [${label.label}] ${message}`)
    }
  }
  public async error(message: any, label: Label | string = this.options.label.error) {
    if (typeof label === "string")
      label = new Label(label, this.options.label.error.size, this.options.label.error.color)
    if (Config.server.log_level >= LEVEL.ERROR) {
      this.writeOutput(label, message)
      if (message instanceof Error) await util.promisify(appendFile)(`${rootDir}/logs/error.log`, `\n[${new Date().toLocaleTimeString()}] [${label.label}] ${message.stack}`)
      else await util.promisify(appendFile)(`${rootDir}/logs/error.log`, `\n[${new Date().toLocaleTimeString()}] [${label.label}] ${message}`)
    }
  }
  public fatal(message: any, label: Label | string = this.options.label.fatal) {
    if (typeof label === "string")
      label = new Label(label, this.options.label.fatal.size, this.options.label.fatal.color)
    if (Config.server.log_level >= LEVEL.FATAL)
      this.writeOutput(label, message)
  }
  public always(message: any, label: Label | string = this.options.label.always) {
    if (typeof label === "string")
      label = new Label(label, this.options.label.always.size, this.options.label.always.color)
    if (Config.server.log_level >= LEVEL.ALWAYS)
      this.writeOutput(label, message)
  }

  public inspect(object: any, options: util.InspectOptions = { depth: null }) {
    const message = util.inspect(object, options)
    const s = message.split(/\r\n|\r|\n/gi)
    const label = new Label("[Inspect]", this.options.label.debug.size, this.options.label.debug.color)
    for (let i=0; i<s.length; i++) {
      this.writeOutput(label, s[i], i<s.length-1)
    }
  }

  public getLabel(level: LEVEL) {
    switch (level) {
      case LEVEL.FATAL: { return this.options.label.fatal }
      case LEVEL.ERROR: { return this.options.label.error }
      case LEVEL.WARN: { return this.options.label.warn }
      case LEVEL.INFO: { return this.options.label.info }
      case LEVEL.DEBUG: { return this.options.label.debug }
      case LEVEL.VERBOSE: { return this.options.label.verbose }
      case LEVEL.ALWAYS: { return this.options.label.always }
      default: { throw new Error("Invalid Log Level [" + level + "]") }
    }
  }

  public setLabel(label: string | Label, level: 0 | LEVEL) {
    if (!level || typeof level != "number")
      throw new Error("Invalid Level")
    if (typeof label === "string") {
      const labelOptions = label
      label = this.getLabel(level)
      label = new Label(labelOptions, label.size, label.color)
    }
    if (!(label instanceof Label))
      throw new Error("Invalid Label")

    switch (level) {
      case 0: { this.setAllLabel(label); break }
      case LEVEL.FATAL: { this.options.label.fatal = label; break }
      case LEVEL.ERROR: { this.options.label.error = label; break }
      case LEVEL.WARN: { this.options.label.warn = label; break }
      case LEVEL.INFO: { this.options.label.info = label; break }
      case LEVEL.DEBUG: { this.options.label.debug = label; break }
      case LEVEL.VERBOSE: { this.options.label.verbose = label; break }
      case LEVEL.ALWAYS: { this.options.label.always = label; break }
      default: { throw new Error("Invalid Log Level [" + level + "]") }
    }
  }

  public setAllLabel(text: string | Label) {
    if (text instanceof Label)
      text = text.label
    if (typeof text != "string")
      throw new Error("Invalid Label Text")
    this.options.label.fatal.label = text
    this.options.label.error.label = text
    this.options.label.warn.label = text
    this.options.label.info.label = text
    this.options.label.debug.label = text
    this.options.label.verbose.label = text
  }

  public setAllLabelSize(size: number) {
    if (typeof size != "number")
      throw new Error("Invalid Label Size")
    this.options.label.fatal.size = size
    this.options.label.error.size = size
    this.options.label.warn.size = size
    this.options.label.info.size = size
    this.options.label.debug.size = size
    this.options.label.verbose.size = size
  }

  public showTime(value: boolean) {
    this.options.showTime = value
  }

  private writeOutput(label: Label, message: any, forceNewLine = false) {
    let labelText = label.label + " "
    const locations = this.options.output || [process.stdout]

    if (typeof message === "object") {
      if (message instanceof Error) {
        this.writeOutput(label, message.stack)
        return
      }

      if (!message || !message.constructor || message.constructor === Object ||
        Array.isArray(message) || (!message.constructor.name)) {
        message = stringify(message, null, 2)
        const s = message.split(/\r\n|\r|\n/)
        for (let i = 0; i < s.length; i++) {
          this.writeOutput(label, s[i], i < s.length - 1)
        }
      } else {
        message = "[" + message.constructor.name + "] " + stringify(message, null, 2)
        const s = message.split(/\r\n|\r|\n/)
        for (let i = 0; i < s.length; i++) {
          this.writeOutput(label, s[i], i < s.length - 1)
        }
      }
      return
    }

    switch (typeof message) {
      case "undefined": {
        message = typeof message
        break
      }
      case "number":
      case "function": {
        message = message.toString()
        break
      }
      case "boolean": {
        message = message ? "True" : "False"
        break
      }
      case "symbol": {
        message = String(message)
        break
      }
      case "string": {
        break
      }
      default: {
        message = "Unhandled Type: " + typeof message
      }
    }

    if (message.includes("\n")) {
      const s = message.split(/\r\n|\r|\n/)
      for (let i = 0; i < s.length; i++) {
        this.writeOutput(label, s[i], i < s.length - 1)
      }
      return
    }

    const currentTime = new Date().toLocaleTimeString() // en-GB uses 24h format

    locations.forEach((location) => {
      while (labelText.length < label.size) labelText = " " + labelText

      if (location instanceof Output) {
        if (location.removeColor) {
          let outputText = `${labelText} | ${message}`
          if (this.options.showTime) {
            outputText = ` [${currentTime}] ${labelText} | ${message}`
          }

          location.writeFunc.apply(location.out, [outputText + (location.addNewLine || forceNewLine ? EOL : "")])
        } else {
          let outputText = label.color.background(label.color.foreground(`${labelText}`)) + " " + message
          if (this.options.showTime) {
            outputText = label.color.background(label.color.foreground(` [${currentTime}] ${labelText}`)) + " " + message
          }
          location.writeFunc.apply(location.out, [outputText + (location.addNewLine || forceNewLine ? EOL : "")])
        }
      }
    })
  }
}

interface CreateOptions {
  labelSize: number
  inspectOptions: util.InspectOptions
  defaultLabel: string
  label: {
    fatal: Label
    error: Label
    warn: Label
    info: Label
    debug: Label
    verbose: Label
    always: Label
  }
  showTime: boolean
  output: Output[]
}

export class Output {
  public removeColor: boolean
  public addNewLine: boolean
  public out: any
  public writeFunc: any

  constructor(out: any, writeFunction: any, newLine = true, removeColor = false) {
    if (typeof writeFunction != "function") throw new Error("Invalid Function")

    this.out = out
    this.writeFunc = writeFunction
    this.addNewLine = newLine
    this.removeColor = removeColor
  }
}

export class Label {
  public label: string
  public color: Color
  public size: number

  constructor(label: string, size: number, color: string | Color, fg?: string) {
    if (!(color instanceof Color)) {
      if (typeof color === "string" && typeof fg === "string") color = new Color(color, fg)
      else throw new Error("Invalid Color")
    }
    if (typeof size != "number") throw new Error("Invalid Size")
    if (typeof label != "string") throw new Error("Invalid Label")
    this.label = label
    this.color = color
    this.size = size
  }
}
class Color {
  public foreground: any
  public background: any

  constructor(background: string, foreground: string) {
    const chalk = Chalk as any // fix compiler error

    if (typeof chalk["bg" + toTitleCase(background)] != "function")
      throw new Error("Invalid Background Color [" + background + "]")
    if (typeof chalk[foreground.toLowerCase()] != "function")
      throw new Error("Invalid Foreground Color [" + foreground + "]")
    this.foreground = chalk[foreground.toLowerCase()]
    this.background = chalk["bg" + toTitleCase(background)]
  }
}
