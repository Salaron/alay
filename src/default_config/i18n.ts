export default <II18nConfig>{
  languages: {
    "English (US)": "en",
    "Русский": "ru"
  },
  defaultLanguage: "ru"
}

interface II18nConfig {
  languages: {
    [langName: string]: string
  }
  defaultLanguage: string
}
