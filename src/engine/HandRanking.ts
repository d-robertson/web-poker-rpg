import { Card, Rank } from '../models/Card'

/**
 * Poker hand rankings from lowest to highest
 */
export enum HandRank {
  HighCard = 0,
  Pair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9,
}

export const HAND_RANK_NAMES: Record<HandRank, string> = {
  [HandRank.HighCard]: 'High Card',
  [HandRank.Pair]: 'Pair',
  [HandRank.TwoPair]: 'Two Pair',
  [HandRank.ThreeOfAKind]: 'Three of a Kind',
  [HandRank.Straight]: 'Straight',
  [HandRank.Flush]: 'Flush',
  [HandRank.FullHouse]: 'Full House',
  [HandRank.FourOfAKind]: 'Four of a Kind',
  [HandRank.StraightFlush]: 'Straight Flush',
  [HandRank.RoyalFlush]: 'Royal Flush',
}

/**
 * Represents an evaluated poker hand with rank and relevant cards
 */
export class HandRanking {
  constructor(
    public readonly rank: HandRank,
    public readonly cards: Card[],
    public readonly primaryValue: number, // Main rank value (e.g., rank of pair/trips)
    public readonly secondaryValue: number = 0, // Secondary value (e.g., second pair in two pair)
    public readonly kickers: number[] = [] // Kicker values for tie-breaking
  ) {}

  /**
   * Gets the human-readable name of this hand
   */
  get name(): string {
    return HAND_RANK_NAMES[this.rank]
  }

  /**
   * Gets a detailed description of the hand
   */
  get description(): string {
    switch (this.rank) {
      case HandRank.RoyalFlush:
        return 'Royal Flush'
      case HandRank.StraightFlush:
        return `Straight Flush, ${this.getRankName(this.primaryValue)} high`
      case HandRank.FourOfAKind:
        return `Four of a Kind, ${this.getRankName(this.primaryValue)}s`
      case HandRank.FullHouse:
        return `Full House, ${this.getRankName(this.primaryValue)}s over ${this.getRankName(this.secondaryValue)}s`
      case HandRank.Flush:
        return `Flush, ${this.getRankName(this.primaryValue)} high`
      case HandRank.Straight:
        return `Straight, ${this.getRankName(this.primaryValue)} high`
      case HandRank.ThreeOfAKind:
        return `Three of a Kind, ${this.getRankName(this.primaryValue)}s`
      case HandRank.TwoPair:
        return `Two Pair, ${this.getRankName(this.primaryValue)}s and ${this.getRankName(this.secondaryValue)}s`
      case HandRank.Pair:
        return `Pair of ${this.getRankName(this.primaryValue)}s`
      case HandRank.HighCard:
        return `High Card, ${this.getRankName(this.primaryValue)}`
    }
  }

  /**
   * Compares this hand to another hand
   * Returns: negative if this < other, 0 if equal, positive if this > other
   */
  compareTo(other: HandRanking): number {
    // First compare by rank
    if (this.rank !== other.rank) {
      return this.rank - other.rank
    }

    // Then compare primary value
    if (this.primaryValue !== other.primaryValue) {
      return this.primaryValue - other.primaryValue
    }

    // Then compare secondary value
    if (this.secondaryValue !== other.secondaryValue) {
      return this.secondaryValue - other.secondaryValue
    }

    // Finally compare kickers
    for (let i = 0; i < Math.max(this.kickers.length, other.kickers.length); i++) {
      const thisKicker = this.kickers[i] ?? 0
      const otherKicker = other.kickers[i] ?? 0
      if (thisKicker !== otherKicker) {
        return thisKicker - otherKicker
      }
    }

    // Hands are exactly equal
    return 0
  }

  private getRankName(value: number): string {
    const ranks: Record<number, string> = {
      2: 'Two',
      3: 'Three',
      4: 'Four',
      5: 'Five',
      6: 'Six',
      7: 'Seven',
      8: 'Eight',
      9: 'Nine',
      10: 'Ten',
      11: 'Jack',
      12: 'Queen',
      13: 'King',
      14: 'Ace',
    }
    return ranks[value] ?? 'Unknown'
  }
}
