export interface IApiMultiResponse {
  result: any
  timeStamp: number
  status: number
  commandNum: false
}
export interface IApiResult {
  status: number
  result: any
  headers?: any
}
// tslint:disable-next-line: no-empty-interface
export interface IWebApiResult extends IApiResult {

}
// tslint:disable-next-line: no-empty-interface
export interface IWebViewResult extends IApiResult {

}
