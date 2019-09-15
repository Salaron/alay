export interface MultiResponse {
  result: any
  timeStamp: number
  status: number
  commandNum: false
}
export interface ActionResult {
  status: number
  result: any
  headers?: any
}
