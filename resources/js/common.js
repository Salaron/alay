window.onerror = function (msg, url, lineNo, columnNo, error) {
  sendRequest({
    module: "report",
    action: "error",
    timestamp: Math.floor(Date.now() / 1000),
    message: msg,
    stacktrace: error == undefined ? null : error.stack,
    url: url
  })
  return false
}
function parseQueryString(string) {
  return JSON.parse('{"' + string.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) { return key === "" ? value : decodeURIComponent(value) })
}
function escapeJSON(jsonString) {
  return jsonString.replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\f/g, "\\f");
}
function nl2br(str){
  return str.replace(/(?:\r\n|\r|\n)/g, "<br>")
}

function setCookie(cname, cvalue, exhours) {
  var d = new Date();
  d.setTime(d.getTime() + (exhours * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function sendNotification(message, status) {
  UIkit.notification({
    message: message,
    status: status,
    pos: 'bottom-center'
  })
}
function sendRequest(params) {
  return $.ajax({
    method: "POST",
    url: "/webapi/" + params.module + "/" + params.action,
    headers: headers,
    dataType: "JSON",
    data: JSON.stringify(params),
    contentType: "application/json",
    success: function (response) {
      if (response.maintenance === true) {
        sendNotification("Сервер находится на тех.обслуживании", "warning")
      } else if (response.error === true) {
        sendNotification(response.message || "Произошла ошибка при попытке получения данных с сервера", "danger")
      } else {
        return response
      }
    },
    error: function (xhr) {
      if (xhr.status === 600) {
        sendNotification(xhr.responseJSON.message, "danger")
      } else if (xhr.status === 500) {
        sendNotification(xhr.statusText, "danger")
      } else {
        sendNotification("Проблема с интернет-соединением", "danger")
      }
    }
  })
}