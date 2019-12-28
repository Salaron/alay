import { escape } from "mysql2"

// https://github.com/MariaDB/mariadb-connector-nodejs/issues/82
export function formatQuery(query: string, values: any = {}) {
  if (!values) return query
  if (Array.isArray(values)) {
    return query.replace(/\?/g, (txt: any, key: any) => {
      if (values.length > 0) {
        return escape(values.shift())
      }
      return txt
    })
  }
  return query.replace(/\:(\w+)/g, (txt: any, key: any) => {
    if (values.hasOwnProperty(key)) {
      return escape(values[key])
    }
    return txt
  })
}
