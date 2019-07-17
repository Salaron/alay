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
  duel: {
    saveLiveResult: false
  },
  unit: {
    removeFromDatabase: false
  },
  user: {
    setBirthOnlyOnce: true,
    userSessionExpire: 82800 // 23 hours
  }
}

interface Modules {
  auth: {
    auth_logging: boolean
  }
  award: {
    unlockAll: boolean
  }
  background: {
    unlockAll: boolean
  }
  download: {
    microDLurl: string
  }
  live: {
    unlockAll: boolean
    continueAttemptsCount: number
  }
  liveSe: {
    list: Array<number>
  }
  liveIcon: {
    list: Array<number>
  }
  personalNotice: {
    welcomeMessageEnabled: boolean
    welcomeMessageType: number
    welcomeMessageTitle: string
    welcomeMessageContents: string
  }
  festival: {
    max_reset_setlist: number
    setlist_type: number
    reset_cost_type: number
    reset_cost_value: number
  }
  duel: {
    saveLiveResult: boolean
  }
  unit: {
    removeFromDatabase: boolean
  }
  user: {
    setBirthOnlyOnce: boolean
    userSessionExpire: number
  }
}