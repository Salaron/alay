export enum buttonType {
  DEFAULT_SINGLE = 1,
  DEFAULT_MULTI = 2,
  MULTI_COST = 3,
  LIMIT_SINGLE = 4,
  LIMIT_MULTI = 5,
  NORMAL_FREE = 6,
  NORMAL_SINGLE = 7,
  NORMAL_MULTI = 8,
  STUB_A = 9,
  STUB_B = 10,
  STUB_C = 11,
  FREE_SINGLE = 12,
  FREE_MULTI = 13
}
export enum secretboxType {
  DEFAULT = 0,
  STEP_UP = 1,
  EXTRA = 2,    // Select???
  BOX = 3,      // Knapsack
  BOX_TYPE = 4, // Not used?
  STUB = 5,     // a.k.a. blue ticket box
  SELECT = 6
}
export enum animationType {
  DEFAULT_TYPE_A = 1,
  DEFAULT_TYPE_B = 2,
  SIMPLE = 3,
  SELECT = 4,
  BOX_TYPE_A = 5,
  BOX_TYPE_B = 6
}

export enum costType {
  NON_COST = 0,
  LOVECA = 3001,
  ITEM_TICKET = 1000,
  FRIEND = 3002,
  FREE_TICKET = 100,
  GAME_COIN = 3000
}

export class ErrorSecretboxNotAvailable extends Error { }
