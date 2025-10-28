import { Rank } from '../models/Card'

/**
 * Parses poker hand notation and expands ranges
 * Examples: AA, KK, AKs, AKo, 99+, ATs+, KQo+
 */
export class HandRangeParser {
  private static readonly RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const
  private static readonly RANK_VALUES: Record<string, number> = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    T: 10,
    '9': 9,
    '8': 8,
    '7': 7,
    '6': 6,
    '5': 5,
    '4': 4,
    '3': 3,
    '2': 2,
  }

  /**
   * Parse a hand notation and expand to all matching hands
   * Examples:
   * - "AA" → ["AA"]
   * - "99+" → ["AA", "KK", "QQ", "JJ", "TT", "99"]
   * - "ATs+" → ["AKs", "AQs", "AJs", "ATs"]
   * - "KQo" → ["KQo"]
   */
  static parseHandNotation(notation: string): string[] {
    notation = notation.trim()

    // Normalize: uppercase ranks but keep 's'/'o' lowercase
    notation = notation.replace(/[AKQJT98765432]+/g, (match) => match.toUpperCase())

    // Check if it's a range (contains +)
    if (notation.endsWith('+')) {
      return this.expandRange(notation)
    }

    // Single hand notation
    return [notation]
  }

  /**
   * Parse multiple hand notations and combine
   * Example: ["AA", "KK", "99+", "AKs"] → ["AA", "KK", "QQ", "JJ", "TT", "99", "AKs"]
   */
  static parseHandRange(notations: string[]): string[] {
    const allHands = new Set<string>()

    for (const notation of notations) {
      const hands = this.parseHandNotation(notation)
      hands.forEach((hand) => allHands.add(hand))
    }

    return Array.from(allHands)
  }

  /**
   * Check if a specific hand matches a range notation
   * Example: isHandInRange("QQ", ["99+", "AKs"]) → true
   */
  static isHandInRange(hand: string, rangeNotations: string[]): boolean {
    const expandedRange = this.parseHandRange(rangeNotations)
    return expandedRange.includes(hand)
  }

  /**
   * Expand a range notation (notation ending with +)
   */
  private static expandRange(notation: string): string[] {
    const baseNotation = notation.slice(0, -1) // Remove the +

    // Pocket pairs (e.g., 99+)
    if (this.isPocketPair(baseNotation)) {
      return this.expandPocketPairRange(baseNotation)
    }

    // Suited hands (e.g., ATs+)
    if (baseNotation.endsWith('s')) {
      return this.expandSuitedRange(baseNotation)
    }

    // Offsuit hands (e.g., ATo+)
    if (baseNotation.endsWith('o')) {
      return this.expandOffsuitRange(baseNotation)
    }

    // If no suit specified, assume both suited and offsuit
    // (e.g., "AT+" means both "ATs+" and "ATo+")
    return [...this.expandSuitedRange(baseNotation + 's'), ...this.expandOffsuitRange(baseNotation + 'o')]
  }

  /**
   * Check if notation is a pocket pair (same rank twice)
   */
  private static isPocketPair(notation: string): boolean {
    return notation.length === 2 && notation[0] === notation[1]
  }

  /**
   * Expand pocket pair range
   * Example: 99+ → ["AA", "KK", "QQ", "JJ", "TT", "99"]
   */
  private static expandPocketPairRange(baseHand: string): string[] {
    const rank = baseHand[0]!
    const rankValue = this.RANK_VALUES[rank]

    if (!rankValue) {
      throw new Error(`Invalid pocket pair: ${baseHand}`)
    }

    const pairs: string[] = []
    for (const r of this.RANKS) {
      const value = this.RANK_VALUES[r]!
      if (value >= rankValue) {
        pairs.push(r + r)
      }
    }

    return pairs
  }

  /**
   * Expand suited hand range
   * Example: ATs+ → ["AKs", "AQs", "AJs", "ATs"]
   */
  private static expandSuitedRange(baseHand: string): string[] {
    // Remove 's' suffix
    const cards = baseHand.slice(0, -1)
    if (cards.length !== 2) {
      throw new Error(`Invalid suited hand: ${baseHand}`)
    }

    const highCard = cards[0]!
    const lowCard = cards[1]!

    const highValue = this.RANK_VALUES[highCard]
    const lowValue = this.RANK_VALUES[lowCard]

    if (!highValue || !lowValue) {
      throw new Error(`Invalid card ranks in: ${baseHand}`)
    }

    const hands: string[] = []

    // For each rank between lowCard and one below highCard
    for (const r of this.RANKS) {
      const value = this.RANK_VALUES[r]!
      if (value < highValue && value >= lowValue) {
        hands.push(highCard + r + 's')
      }
    }

    return hands
  }

  /**
   * Expand offsuit hand range
   * Example: ATo+ → ["AKo", "AQo", "AJo", "ATo"]
   */
  private static expandOffsuitRange(baseHand: string): string[] {
    // Remove 'o' suffix
    const cards = baseHand.slice(0, -1)
    if (cards.length !== 2) {
      throw new Error(`Invalid offsuit hand: ${baseHand}`)
    }

    const highCard = cards[0]!
    const lowCard = cards[1]!

    const highValue = this.RANK_VALUES[highCard]
    const lowValue = this.RANK_VALUES[lowCard]

    if (!highValue || !lowValue) {
      throw new Error(`Invalid card ranks in: ${baseHand}`)
    }

    const hands: string[] = []

    // For each rank between lowCard and one below highCard
    for (const r of this.RANKS) {
      const value = this.RANK_VALUES[r]!
      if (value < highValue && value >= lowValue) {
        hands.push(highCard + r + 'o')
      }
    }

    return hands
  }

  /**
   * Convert actual hole cards to hand notation
   * Example: ["A♠", "K♠"] → "AKs", ["A♠", "K♦"] → "AKo", ["K♠", "K♦"] → "KK"
   */
  static cardsToHandNotation(card1: string, card2: string): string {
    const rank1 = card1[0]!
    const suit1 = card1.slice(1)
    const rank2 = card2[0]!
    const suit2 = card2.slice(1)

    const value1 = this.RANK_VALUES[rank1]
    const value2 = this.RANK_VALUES[rank2]

    if (!value1 || !value2) {
      throw new Error(`Invalid cards: ${card1}, ${card2}`)
    }

    // Pocket pair
    if (rank1 === rank2) {
      return rank1 + rank2
    }

    // Order by value (higher card first)
    const highRank = value1 > value2 ? rank1 : rank2
    const lowRank = value1 > value2 ? rank2 : rank1

    // Suited or offsuit
    const suited = suit1 === suit2
    return highRank + lowRank + (suited ? 's' : 'o')
  }
}
