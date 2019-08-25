export default <Modules>{
  award: {
    unlockAll: false
  },
  background: {
    unlockAll: false
  },
  download: {
    microDLurl: "http://"
  },
  live: {
    unlockAll: false,
    continueAttemptsCount: 3
  },
  liveSe: {
    list: []
  },
  liveIcon: {
    list: []
  },
  login: {
    auth_logging: true,
    webview_login: true,
    enable_registration: true,
    enable_recaptcha: false,
    recaptcha_site_key: "",
    recaptcha_private_key: ""
  },
  personalNotice: {
    welcomeMessageEnabled: false,
    welcomeMessageType: 1,
    welcomeMessageTitle: "",
    welcomeMessageContents: ""
  },
  festival: {
    max_reset_setlist: 15,
    setlist_type: 2,
    reset_cost_type: 3,
    reset_cost_value: 5000
  },
  unit: {
    removeFromDatabase: false
  },
  unitSelect: {
    museCenterUnits: [49, 50, 51, 52, 53, 54, 55, 56, 57],
    aqoursCenterUnits: [788, 789, 790, 791, 792, 793, 794, 795, 796]
  },
  user: {
    setBirthOnlyOnce: true,
    userSessionExpire: 82800 // 23 hours
  }
}