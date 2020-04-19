import { parseQueryString } from "../utils"
import $ from "jquery"

$(() => {
  const values = parseQueryString()
  const offset = $(`#announce-${values.id}`).offset()
  if (values.id && offset) {
    $("#body").animate({
      scrollTop: offset.top - 60
    }, 1000)
  }
})