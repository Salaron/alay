export class ErrorCode extends Error {
  public code: number
  public response: any
  constructor(code: number) {
    super()
    this.code = code
    this.response = {
      status: 600,
      responseData: {
        error_code: this.code
      }
    }
  }
}
(global as any).ErrorCode = ErrorCode