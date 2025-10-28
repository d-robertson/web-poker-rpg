/**
 * GTO (Game Theory Optimal) Types for AI Decision Making
 */

export enum Position {
  UTG = 'UTG', // Under the gun (early position)
  UTG1 = 'UTG+1',
  MP = 'MP', // Middle position
  LJ = 'LJ', // Lojack
  HJ = 'HJ', // Hijack
  CO = 'CO', // Cutoff
  BTN = 'BTN', // Button (dealer)
  SB = 'SB', // Small blind
  BB = 'BB', // Big blind
}

export enum ActionType {
  FOLD = 'fold',
  CHECK = 'check',
  CALL = 'call',
  BET = 'bet',
  RAISE = 'raise',
}

export enum HandStrength {
  NUTS = 'nuts', // Best possible hand
  STRONG = 'strong', // Strong made hand (top pair good kicker, overpair, etc.)
  MEDIUM = 'medium', // Medium made hand (middle pair, weak top pair)
  WEAK = 'weak', // Weak made hand or draw
  AIR = 'air', // Nothing (high card, missed draw)
}

export enum BoardTexture {
  DRY = 'dry', // Rainbow, disconnected (e.g., K♥ 7♠ 2♦)
  WET = 'wet', // Connected, suited, many draws (e.g., 9♠ 8♠ 7♥)
  PAIRED = 'paired', // Board has a pair (e.g., K♥ K♠ 7♦)
}

export enum StreetType {
  PREFLOP = 'preflop',
  FLOP = 'flop',
  TURN = 'turn',
  RIVER = 'river',
}

/**
 * Represents a preflop hand range
 */
export interface PreFlopRange {
  position: Position
  action: 'open' | '3bet' | '4bet' | 'call' | 'fold'
  facingAction?: 'open' | 'raise' | '3bet' // What action we're responding to
  hands: string[] // Array of hand notations (e.g., ['AA', 'KK', 'AKs'])
  frequency: number // 0-1, for mixed strategies (1 = always, 0.5 = 50% of time)
}

/**
 * Represents a postflop strategy guideline
 */
export interface PostFlopStrategy {
  street: StreetType
  handStrength: HandStrength
  boardTexture: BoardTexture
  position: 'IP' | 'OOP' // In position or out of position
  facingAction: 'none' | 'bet' | 'raise' // What we're facing
  action: ActionType
  frequency: number // How often to take this action
  sizings?: number[] // Bet/raise sizing options as fraction of pot (e.g., [0.33, 0.66, 1.0])
}

/**
 * AI skill level configuration
 */
export interface AISkillLevel {
  name: string // Display name (e.g., "Beginner", "Expert")
  adherence: number // 0.0 to 1.0 - how often they follow GTO
  deviationBehavior: DeviationBehavior
}

export enum DeviationBehavior {
  PASSIVE = 'passive', // When deviating: check > bet, call > raise, fold more
  AGGRESSIVE = 'aggressive', // When deviating: bet > check, raise > call
  RANDOM = 'random', // Random legal action
}

/**
 * Predefined skill levels
 */
export const SKILL_LEVELS: Record<string, AISkillLevel> = {
  BEGINNER: {
    name: 'Beginner',
    adherence: 0.45,
    deviationBehavior: DeviationBehavior.PASSIVE,
  },
  INTERMEDIATE: {
    name: 'Intermediate',
    adherence: 0.65,
    deviationBehavior: DeviationBehavior.RANDOM,
  },
  ADVANCED: {
    name: 'Advanced',
    adherence: 0.80,
    deviationBehavior: DeviationBehavior.AGGRESSIVE,
  },
  EXPERT: {
    name: 'Expert',
    adherence: 0.92,
    deviationBehavior: DeviationBehavior.RANDOM,
  },
  PERFECT: {
    name: 'Perfect',
    adherence: 1.0,
    deviationBehavior: DeviationBehavior.RANDOM, // Never deviates
  },
}

/**
 * Situation context for making decisions
 */
export interface DecisionContext {
  street: StreetType
  position: Position
  isInPosition: boolean
  facingAction: 'none' | 'bet' | 'raise' | 'open' | '3bet'
  potSize: number
  callAmount: number
  playerChips: number
  playerBet: number
  communityCards: string[] // Card shorthands
  holeCards: string[] // Card shorthands
}
