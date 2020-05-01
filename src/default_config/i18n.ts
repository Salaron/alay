export default <II18nConfig>{
  languages: {
    "Русский": "ru",
    "English (United Kingdom)": "en-gb",
    "简体中文": "zh-cn"
  },
  defaultLanguage: "ru"
}

interface II18nConfig {
  languages: {
    [langName: string]: string
  }
  defaultLanguage: string
}
