export default <Modules>{
  auth: {
    auth_logging: true
  },
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
    continueAttemptsCount: 10
  },
  liveSe: {
    list: []
  },
  liveIcon: {
    list: []
  },
  personalNotice: {
    welcomeMessageEnabled: true,
    welcomeMessageType: 1,
    welcomeMessageTitle: "TOS",
    welcomeMessageContents: "2019.07.01 было добавлено TOS. В следующем окне Вам предложат ознакомиться с ним\nи пройти первую настройку."
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