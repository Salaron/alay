export default <LLclient>{
  host: "http://prod-jp.lovelive.ge.klabgames.net",
  application_key: "",
  base_key: "",
  login_key: "",
  login_passwd: "",
  client_version: "37.13",
  bundle_version: "6.5.4",
  public_key: "",
  links_from_prod_server: false
}

interface LLclient {
  host: string
  application_key: string
  base_key: string
  login_key: string
  login_passwd: string
  client_version: string
  bundle_version: string
  public_key: string
  links_from_prod_server: boolean
}
