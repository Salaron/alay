// tslint:disable:variable-name
export class ErrorAPI extends Error {
  public error_code: number
  public response: any
  constructor(ErrorAPI: number)
  constructor(message: string)
  constructor(ErrorAPI: number, message: string)
  constructor(ErrorAPI: string | number, message?: string) {
    super()
    this.error_code = Type.isInt(ErrorAPI) ? ErrorAPI : 0
    this.response = {
      status: 600,
      result: {
        error_code: this.error_code,
        message
      }
    }
  }
}
export class ErrorUserId extends Error {
  public user_id: number
  constructor(message: string, user_id: number) {
    super(message)
    this.message += `; user_id: ${user_id}`
    this.user_id = user_id
  }
}
export class ErrorWebApi extends Error {
  public sendToClient: boolean
  constructor(message: string, sendToClient = false) {
    super(message)
    this.sendToClient = sendToClient
  }
}
