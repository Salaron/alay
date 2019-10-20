// tslint:disable:variable-name
export class ErrorCode extends Error {
  public code: number
  public response: any
  constructor(code: number, message?: string) {
    super()
    this.code = code
    this.response = {
      status: 600,
      result: {
        error_code: this.code,
        message
      }
    }
  }
}
export class ErrorUser extends Error {
  public user_id: number | null
  constructor(message: string, user_id: number | null) {
    super(message)
    this.message += `;\nuser_id: ${user_id}`
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
(global as any).ErrorCode = ErrorCode;
(global as any).ErrorUser = ErrorUser;
(global as any).ErrorWebApi = ErrorWebApi
