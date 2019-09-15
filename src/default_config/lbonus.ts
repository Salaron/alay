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
    2: {
      name: "blue_tickets",
      amount: 1
    },
    3: {
      name: "loveca",
      amount: 5
    },
    4: {
      name: "green_tickets",
      amount: 5
    },
    5: {
      name: "blue_tickets",
      amount: 2
    },
    6: {
      name: "loveca",
      amount: 10
    },
    7: {
      name: "blue_tickets",
      amount: 3
    },
    8: {
      name: "gt",
      amount: 10
    },
    9: {
      name: "bt",
      amount: 4
    },
    10: {
      name: "loveca",
      amount: 25
    },
    20: {
      name: "gt",
      amount: 25
    },
    40: {
      name: "bt",
      amount: 5
    },
    60: {
      name: "bt",
      amount: 10
    },
    80: {
      name: "card",
      amount: 10,
      item_id: 1085
    },
    100: {
      name: "lg",
      amount: 50
    },
    200: {
      name: "bt",
      amount: 15
    },
    300: {
      name: "lg",
      amount: 100
    },
    365: {
      name: "card",
      amount: 5,
      item_id: 1409
    },
    400: {
      name: "bt",
      amount: 25
    },
    500: {
      name: "lg",
      amount: 200
    },
    600: {
      name: "bt",
      amount: 35
    },
    700: {
      name: "lg",
      amount: 500
    }
  }
}
