(() => {
  $("#changeLanguage").on("click", function () {
    UIkit.modal("#languageSelect").toggle();
  });
  $("input[type=radio][name='language_radio']").change(function () {
    var href = window.location.href
    if (!href.includes("lang")) {
      href += "&lang=&"
    }
    if (typeof guest === "undefined") {
      var params = {
        module: "settings",
        action: "changeLanguage",
        code: $(this).val(),
        timestamp: Math.floor(Date.now() / 1000)
      };
      $.when(sendRequest(params)).done(function (response) {
        if (response.error || response.maintenance) return;
        sendNotification(
          "Success. This page will reload automatically.",
          "success"
        );
        setTimeout(window.location.reload.bind(window.location), 1000);
      });
    } else {
      window.location.replace(href.replace(/lang.+&/, "lang=" + $(this).val() + "&"))
    };
  });
})();
