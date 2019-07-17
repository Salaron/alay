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