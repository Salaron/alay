import $ from "jquery"
import UIkit from "uikit"
import { authToken, headers, isWebview, userId } from "./global"

/**
 * Set a cookies in browser
 * @param name Cookie name
 * @param value Cookie value
 * @param exdays Count of days after the cookie will expire
 */
export function setCookie(name: string, value: string, exdays?: number) {
  let expires = ""
  if (exdays) {
    const date = new Date()
    date.setDate(date.getDate() + exdays)
    expires = `expires=${date.toUTCString()};`
  }
  document.cookie = `${name}=${value}; ${expires} path=/`
}

/**
 * Get cookie value
 * @returns {string} Cookie value
 * @returns {null} If cookie not exists
 */
export function getCookie(name: string) {
  const value = `$; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()!.split(";").shift()
  return null
}

/**
 * Remove a cookie
 * @param name Cookie name
 */
export function removeCookie(name: string) {
  setCookie(name, "", -1)
}

/**
 * Parse query
 * @param str
 */
export function parseQueryString(str?: string): { [key: string]: string } {
  if (!str) {
    str = window.location.search.replace("?", "")
    if (str === "") return {}
  }
  const items = str.split("&")

  return items.reduce((data, item) => {
    const [key, value] = item.split("=")
    data[key] = value
    return data
  }, <any>{})
}

/**
 * Show a notification in bottom
 */
export function showNotification(message: string, status?: "primary" | "success" | "warning" | "danger") {
  UIkit.notification({
    message,
    status,
    pos: "bottom-center"
  })
}

/**
 * @param endpoint endpoint string in "module/action" format
 * @param data Object
 */
export async function sendRequest(endpoint: string, data: any) {
  try {
    const _endpointSplit = endpoint.split("/")
    const module = _endpointSplit[0]
    const action = _endpointSplit[1]
    data.module = module
    data.action = action
    data.timeStamp = Math.floor(Date.now() / 1000) // is that useful?
    const response = await $.ajax({
      url: `/webapi/${endpoint}`,
      method: "POST",
      dataType: "JSON",
      contentType: "application/json",
      headers,
      data: JSON.stringify(data),
      xhrFields: {
        withCredentials: true // to allow send cookies
      }
    })
    if (response.response_data) return response.response_data
    return response
  } catch (err) {
    if (err.status > 500 && err.responseJSON && err.responseJSON.message) {
      showNotification(err.responseJSON.message, "danger")
    } else {
      showNotification("Проблема с интернет-соединением", "danger")
    }
    throw err
  }
}

/**
 * Format URL to open it in browser from application
 */
export function getExternalURL(url?: string) {
  let sp = "?"
  if (location.href.includes("?")) {
    sp = "&"
  }
  if (!url) url = location.href
  const browserURL = `${url}${sp}user_id=${userId}&token=${authToken}`
  return `native://browser?url=${encodeURIComponent(browserURL)}`
}

/**
 * Not finished
 */
export function getMailToURL(mail: string) {
  if (isWebview) {
    return `native://mail`
  } else {
    return `mailto:${mail}`
  }
}

export function protectPage(disableProtect?: boolean): void {
  if (disableProtect) {
    $("#backButton, #external").fadeIn(200)
    $(".uk-button").removeAttr("disabled")
  } else {
    $("#backButton, #external").fadeOut(200)
    $(".uk-button").attr("disabled")
  }
}

export function hideVirtualKeyboard(): void {
  $("input").blur()
}

export function formatString(template: string, values: any): string {
  return template.replace(/{{\s?([^{}\s]*)\s?}}/g, (txt: any, key: any) => {
    if (values.hasOwnProperty(key)) {
      return values[key]
    }
    return txt
  })
}

export function checkMailFormat(mail: string): boolean {
  const regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
  return regex.test(mail)
}

export function checkPasswordFormat(pass: string): boolean {
  const regex = /^[A-Za-z0-9]\w{1,32}$/ // max 32 symbols
  return regex.test(pass)
}