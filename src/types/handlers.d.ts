interface Authorize {
  consumerKey: string
  timeStamp: number
  version: string
  nonce: string | number
  token?: string 
  requestTimeStamp?: number
}
interface MultiResponse {
  result: any
  timeStamp: number
  status: number
  commandNum: false
}
interface ActionResult {
  status: number
  result: any
}