export default <i18n>{
  supportedLanguages: ["Русский", "English (US)"],
  langCodes: {
    "English (US)": "en",
    "Русский": "ru"
  },
  defaultLanguage: "ru"
}

interface i18n {
  supportedLanguages: Array<string>
  langCodes: langCodes
  defaultLanguage: string
}
type langCodes = {
  [langName: string]: string
}