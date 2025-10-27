/**
 * Represents the current state of a poker hand
 */
export enum GameState {
  // Pre-hand states
  WaitingForPlayers = 'WAITING_FOR_PLAYERS',
  ReadyToStart = 'READY_TO_START',

  // Hand states
  PostingBlinds = 'POSTING_BLINDS',
  DealingHoleCards = 'DEALING_HOLE_CARDS',
  PreflopBetting = 'PREFLOP_BETTING',
  DealingFlop = 'DEALING_FLOP',
  FlopBetting = 'FLOP_BETTING',
  DealingTurn = 'DEALING_TURN',
  TurnBetting = 'TURN_BETTING',
  DealingRiver = 'DEALING_RIVER',
  RiverBetting = 'RIVER_BETTING',
  Showdown = 'SHOWDOWN',

  // Post-hand states
  HandComplete = 'HAND_COMPLETE',
  GameOver = 'GAME_OVER',
}

/**
 * Validates if a state transition is valid
 */
export function isValidTransition(from: GameState, to: GameState): boolean {
  const validTransitions: Record<GameState, GameState[]> = {
    [GameState.WaitingForPlayers]: [GameState.ReadyToStart],
    [GameState.ReadyToStart]: [GameState.PostingBlinds],
    [GameState.PostingBlinds]: [GameState.DealingHoleCards],
    [GameState.DealingHoleCards]: [GameState.PreflopBetting],
    [GameState.PreflopBetting]: [GameState.DealingFlop, GameState.Showdown, GameState.HandComplete],
    [GameState.DealingFlop]: [GameState.FlopBetting],
    [GameState.FlopBetting]: [GameState.DealingTurn, GameState.Showdown, GameState.HandComplete],
    [GameState.DealingTurn]: [GameState.TurnBetting],
    [GameState.TurnBetting]: [GameState.DealingRiver, GameState.Showdown, GameState.HandComplete],
    [GameState.DealingRiver]: [GameState.RiverBetting],
    [GameState.RiverBetting]: [GameState.Showdown, GameState.HandComplete],
    [GameState.Showdown]: [GameState.HandComplete],
    [GameState.HandComplete]: [GameState.ReadyToStart, GameState.GameOver],
    [GameState.GameOver]: [],
  }

  return validTransitions[from]?.includes(to) ?? false
}

/**
 * Gets the next expected state in normal game flow
 */
export function getNextState(current: GameState, allButOneFolded: boolean = false): GameState {
  // If all but one player folded, skip to hand complete
  if (allButOneFolded && isBettingState(current)) {
    return GameState.HandComplete
  }

  switch (current) {
    case GameState.WaitingForPlayers:
      return GameState.ReadyToStart
    case GameState.ReadyToStart:
      return GameState.PostingBlinds
    case GameState.PostingBlinds:
      return GameState.DealingHoleCards
    case GameState.DealingHoleCards:
      return GameState.PreflopBetting
    case GameState.PreflopBetting:
      return GameState.DealingFlop
    case GameState.DealingFlop:
      return GameState.FlopBetting
    case GameState.FlopBetting:
      return GameState.DealingTurn
    case GameState.DealingTurn:
      return GameState.TurnBetting
    case GameState.TurnBetting:
      return GameState.DealingRiver
    case GameState.DealingRiver:
      return GameState.RiverBetting
    case GameState.RiverBetting:
      return GameState.Showdown
    case GameState.Showdown:
      return GameState.HandComplete
    case GameState.HandComplete:
      return GameState.ReadyToStart
    case GameState.GameOver:
      return GameState.GameOver
  }
}

/**
 * Checks if the current state is a betting state
 */
export function isBettingState(state: GameState): boolean {
  return [
    GameState.PreflopBetting,
    GameState.FlopBetting,
    GameState.TurnBetting,
    GameState.RiverBetting,
  ].includes(state)
}

/**
 * Checks if the current state is a dealing state
 */
export function isDealingState(state: GameState): boolean {
  return [
    GameState.DealingHoleCards,
    GameState.DealingFlop,
    GameState.DealingTurn,
    GameState.DealingRiver,
  ].includes(state)
}
