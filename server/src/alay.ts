import express from "express"
import { Validator } from "@alay/shared"

(async() => {
  // init config
  // init sqlite3 connector
  // connect to databases
  // prepare head modules
  // start server interface
  new Validator().Email("")
  const app = express()
  app.listen(8080, () => {
    console.log("started") 
  })
})().catch(err => console.error(err))