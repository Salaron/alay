export default <Database>{
  autoReconnect: true,
  autoReconnectDelay: 2000,
  autoReconnectMaxAttempt: 10,
  connectionLimit: 30,
  dateStrings: true,
  host: "localhost",
  user: "",
  password: "",
  database: ""
}

interface Database {
  autoReconnect: boolean
  autoReconnectDelay: number
  autoReconnectMaxAttempt: number
  connectionLimit: number
  dateStrings: boolean
  host: string
  user: string
  password: string
  database: string
}
