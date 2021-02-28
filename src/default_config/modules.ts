export default <IModules>{
  award: {
    unlockAll: false
  },
  background: {
    unlockAll: false
  },
  download: {
    microDLurl: "http://",
    urls: []
  },
  live: {
    unlockAll: false,
    continueAttemptsCount: 3
  },
  login: {
    auth_logging: true,
    enable_registration: true
  },
  personalNotice: {
    welcomeMessageEnabled: false,
    welcomeMessageType: 1,
    welcomeMessageTitle: "",
    welcomeMessageContents: ""
  },
  festival: {
    max_reset_setlist: 15,
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

interface IModules {
  award: {
    unlockAll: boolean
  }
  background: {
    unlockAll: boolean
  }
  download: {
    microDLurl: string
    urls: {
      name: string
      url: string
    }[]
  }
  live: {
    unlockAll: boolean
    continueAttemptsCount: number
  }
  login: {
    auth_logging: boolean
    enable_registration: boolean
  }
  personalNotice: {
    welcomeMessageEnabled: boolean
    welcomeMessageType: number
    welcomeMessageTitle: string
    welcomeMessageContents: string
  }
  festival: {
    max_reset_setlist: number
    reset_cost_type: number
    reset_cost_value: number
  }
  unit: {
    removeFromDatabase: boolean
  }
  unitSelect: {
    museCenterUnits: number[]
    aqoursCenterUnits: number[]
  }
  user: {
    setBirthOnlyOnce: boolean
    userSessionExpire: number
  }
}
