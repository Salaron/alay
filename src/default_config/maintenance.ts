
export default <IMantenanceConfig>{
  force_enabled: false,
  notice: true,
  start_date: "2000-01-01 00:00:00",
  end_date: "2000-01-01 00:00:00",
  time_zone: +9,
  bypass: []
}

interface IMantenanceConfig {
  force_enabled: boolean
  notice: boolean
  start_date: string
  end_date: string
  time_zone: number
  bypass: number[]
}
