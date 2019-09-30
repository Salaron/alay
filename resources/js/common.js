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
function nl2br(str) {
  return str.replace(/(?:\r\n|\r|\n)/g, "<br>")
}

function setCookie(cname, cvalue, exhours) {
  var d = new Date();
  d.setTime(d.getTime() + (exhours * 60 * 60 * 1000));
  var expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
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
      if (xhr.status === 600 || xhr.status === 500) {
        if (xhr.responseJSON && xhr.responseJSON.response_data && xhr.responseJSON.response_data.message) sendNotification(xhr.responseJSON.response_data.message, "danger")
        else if (xhr.responseJSON && xhr.responseJSON.message) sendNotification(xhr.responseJSON.message, "danger")
        else if (xhr.responseText) sendNotification(xhr.responseText, "danger")
        else sendNotification(xhr.statusText, "danger")
      } else {
        sendNotification("Проблема с интернет-соединением", "danger")
      }
    }
  })
}

function xor(str1, str2) {
  function toUTF8array(str) {
    var utf8 = unescape(encodeURIComponent(str));

    var arr = [];
    for (var i = 0; i < utf8.length; i++) {
      arr.push(utf8.charCodeAt(i));
    }
    return arr
  }
  function fromUTF8array(arr) {
    var str = ""
    for (var i = 0; i < arr.length; i++) {
      str += String.fromCharCode(arr[i])
    }
    return str
  }
  var arr1 = toUTF8array(str1)
  var arr2 = toUTF8array(str2)

  var count = arr1.length > arr2.length ? arr2.length : arr1.length
  var result = []
  for (var i = 0; i < count; i++) {
    result.push(arr1[i] ^ arr2[i])
  }
  return fromUTF8array(result)
}
function checkPass(input) {
  return input.match(/^[A-Za-z0-9]\w{1,32}$/)
}
function checkUser(input) {
  return (
    input.toString().match(/^[0-9]\w{0,10}$/) &&
    parseInt(input) === parseInt(input) &&
    parseInt(input) > 0
  )
}
function checkMail(input) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,6})+$/
  return regex.test(input)
}

function replacePlaceholders(input, values) {
  return input.replace(/{{\s?([^{}\s]*)\s?}}/g, function (txt, key) {
    if (values.hasOwnProperty(key)) {
      return values[key]
    }
    return txt
  })
}

function updateBodySize() {
  $("#body").height($(window).height() - $("#body").offset().top - 20)
  if (typeof ps != "undefined") ps.update()
}
function isChrome() {
  var isChromium = window.chrome;
  var winNav = window.navigator;
  var vendorName = winNav.vendor;
  var isOpera = typeof window.opr !== "undefined";
  var isIEedge = winNav.userAgent.indexOf("Edge") > -1;
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  return (
    isChromium !== null &&
    typeof isChromium !== "undefined" &&
    vendorName === "Google Inc." &&
    isOpera === false &&
    isIEedge === false &&
    isMobile === true
  )
}

(() => {
  if ($ && typeof enableResize != "undefined") {
    updateBodySize();

    $(function () {
      updateBodySize();
    })
    $(window).resize(function () {
      updateBodySize();
    });
  }
})()
