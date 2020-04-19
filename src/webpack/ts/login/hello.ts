import $ from "jquery"
import { parseQueryString, removeCookie, setCookie } from "../utils"

$(() => {
  removeCookie("user_id")
  const params = parseQueryString()
  if (params.token) setCookie("token", params.token, 1)
})