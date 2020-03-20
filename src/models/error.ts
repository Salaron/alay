// tslint:disable:variable-name
export class ErrorAPI extends Error {
  public error_code: number
  public response: any
  constructor(errorCode: number)
  constructor(message: string)
  constructor(errorCode: number, message: string)
  constructor(errorCode: string | number, message?: string) {
    super()
    this.error_code = Type.isInt(errorCode) ? errorCode : -1
    this.response = {
      status: 600,
      result: {
        error_code: Type.isNumber(errorCode) ? this.error_code : undefined,
        message: Type.isString(errorCode) ? errorCode : message
      }
    }
  }
}
export class ErrorWebAPI extends ErrorAPI {
  constructor(message: string) {
    super(message)
    this.response = {
      error: true,
      message
    }
  }
}

export class RequestError extends Error {
  public message: string
  public statusCode: number
  constructor(message: string, statusCode: number) {
    super(message)
    this.message = message
    this.statusCode = statusCode
  }
}
