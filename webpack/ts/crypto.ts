import { authToken, publicKey } from "./global"
const { JSEncrypt } = require("jsencrypt") // tslint:disable-line

const JSEncryptInstance = new JSEncrypt()
JSEncryptInstance.setKey(publicKey)
export function simpleEncrypt(data: string) {
  return RSAEncrypt(xor(data, authToken))
}

export function RSAEncrypt(data: string) {
  return JSEncryptInstance.encrypt(data)
}

export function xor(str1: string, str2: string) {
  function toUTF8array(str: string) {
    const utf8 = unescape(encodeURIComponent(str))

    let result = []
    for (let i = 0; i < utf8.length; i++) {
      result.push(utf8.charCodeAt(i))
    }
    return result
  }
  function fromUTF8array(utf8Array: number[]) {
    let result = ""
    for (const char of utf8Array) {
      result += String.fromCharCode(char)
    }
    return result
  }
  const arr1 = toUTF8array(str1)
  const arr2 = toUTF8array(str2)

  const count = arr1.length > arr2.length ? arr2.length : arr1.length
  let result = []
  for (let i = 0; i < count; i++) {
    result.push(arr1[i] ^ arr2[i])
  }
  return fromUTF8array(result)
}
