export interface IApiMultiResponse {
  result: any
  timeStamp: number
  status: number
  commandNum: false
}
export interface IAPIResult {
  status: number
  result: any
  headers?: any
}
// tslint:disable-next-line: no-empty-interface
export interface IWebAPIResult extends IAPIResult {

}
// tslint:disable-next-line: no-empty-interface
export interface IWebViewResult extends IAPIResult {

}
