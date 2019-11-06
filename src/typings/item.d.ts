type itemName = "loveca" | "bt_ticket" | "green_ticket" | "game_coin" | "friend_pts" | "unit" | "exchange_point" | "sis"
type item = {
  name: itemName
  item_id?: number
  min_amount: number
  max_amount: number
} | {
  name: itemName
  item_id?: number
  amount: number[]
} | {
  name: itemName
  item_id?: number
  amount: number
}
