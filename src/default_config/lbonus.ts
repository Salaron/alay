export default <LBonus>{
  calendar_generator: {
    cards_query: "SELECT unit_id FROM unit_m WHERE disable_rank_up=1 OR disable_rank_up=3", // support cards
    card_limit: 5, // max cards that can be in one month
    special_flag_types: [1001], // starred days
    items: [
      { // min and max values included
        name: "loveca",
        min_amount: 5,
        max_amount: 10
      },
      { // one of prepared values
        name: "blue_tickets",
        amount: [5, 10, 15]
      },
      { // static amount
        name: "green_tickets",
        amount: 5
      },
      {
        name: "coins",
        min_amount: 5000,
        max_amount: 50000
      }
    ]
  },
  total_login_bonus: {
    1: {
      name: "green_tickets",
      amount: 1
    },
    5: {
      name: "blue_tickets",
      amount: 1
    },
    20: {
      name: "loveca",
      amount: 20
    },
    50: {
      name: "green_tickets",
      amount: 15
    },
    200: {
      name: "blue_tickets",
      amount: 25
    },
    500: {
      name: "blue_tickets",
      amount: 50
    },
    1000: {
      name: "blue_tickets",
      amount: 100
    }
  }
}

interface LBonus {
  calendar_generator: {
    cards_query: string
    card_limit: number
    special_flag_types: number[]
    items: item[]
  }
  total_login_bonus: {
    [day: string]: {
      name: string
      amount: number
      item_id?: number
    }
  }
}
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