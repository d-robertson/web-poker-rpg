import { Card, Rank } from '../models/Card'
import { HandRank, HandRanking } from './HandRanking'

/**
 * Evaluates poker hands and determines hand rankings
 */
export class HandEvaluator {
  /**
   * Evaluates a 5-card poker hand
   */
  static evaluateHand(cards: Card[]): HandRanking {
    if (cards.length !== 5) {
      throw new Error(`Expected 5 cards, got ${cards.length}`)
    }

    // Sort cards by value (highest first)
    const sortedCards = [...cards].sort((a, b) => b.value - a.value)

    // Check for each hand type from highest to lowest
    const royalFlush = this.checkRoyalFlush(sortedCards)
    if (royalFlush) return royalFlush

    const straightFlush = this.checkStraightFlush(sortedCards)
    if (straightFlush) return straightFlush

    const fourOfAKind = this.checkFourOfAKind(sortedCards)
    if (fourOfAKind) return fourOfAKind

    const fullHouse = this.checkFullHouse(sortedCards)
    if (fullHouse) return fullHouse

    const flush = this.checkFlush(sortedCards)
    if (flush) return flush

    const straight = this.checkStraight(sortedCards)
    if (straight) return straight

    const threeOfAKind = this.checkThreeOfAKind(sortedCards)
    if (threeOfAKind) return threeOfAKind

    const twoPair = this.checkTwoPair(sortedCards)
    if (twoPair) return twoPair

    const pair = this.checkPair(sortedCards)
    if (pair) return pair

    return this.checkHighCard(sortedCards)
  }

  /**
   * Evaluates the best 5-card hand from 7 cards (Texas Hold'em)
   */
  static evaluateBest7CardHand(cards: Card[]): HandRanking {
    if (cards.length !== 7) {
      throw new Error(`Expected 7 cards, got ${cards.length}`)
    }

    // Generate all possible 5-card combinations
    const combinations = this.get5CardCombinations(cards)

    // Evaluate each combination and find the best
    let bestHand: HandRanking | null = null

    for (const combo of combinations) {
      const hand = this.evaluateHand(combo)
      if (!bestHand || hand.compareTo(bestHand) > 0) {
        bestHand = hand
      }
    }

    return bestHand!
  }

  // ============ Hand Check Methods ============

  private static checkRoyalFlush(cards: Card[]): HandRanking | null {
    const straightFlush = this.checkStraightFlush(cards)
    if (straightFlush && straightFlush.primaryValue === 14) {
      // Ace-high straight flush is a royal flush
      return new HandRanking(HandRank.RoyalFlush, cards, 14)
    }
    return null
  }

  private static checkStraightFlush(cards: Card[]): HandRanking | null {
    const isFlush = this.isFlush(cards)
    const straight = this.getStraightHighCard(cards)

    if (isFlush && straight !== null) {
      return new HandRanking(HandRank.StraightFlush, cards, straight)
    }
    return null
  }

  private static checkFourOfAKind(cards: Card[]): HandRanking | null {
    const groups = this.groupByRank(cards)

    for (const [rank, groupCards] of groups.entries()) {
      if (groupCards.length === 4) {
        const kicker = cards.find((c) => c.value !== rank)?.value ?? 0
        return new HandRanking(HandRank.FourOfAKind, cards, rank, 0, [kicker])
      }
    }
    return null
  }

  private static checkFullHouse(cards: Card[]): HandRanking | null {
    const groups = this.groupByRank(cards)

    let threeRank: number | null = null
    let pairRank: number | null = null

    for (const [rank, groupCards] of groups.entries()) {
      if (groupCards.length === 3) {
        threeRank = rank
      } else if (groupCards.length === 2) {
        pairRank = rank
      }
    }

    if (threeRank !== null && pairRank !== null) {
      return new HandRanking(HandRank.FullHouse, cards, threeRank, pairRank)
    }
    return null
  }

  private static checkFlush(cards: Card[]): HandRanking | null {
    if (this.isFlush(cards)) {
      const values = cards.map((c) => c.value).sort((a, b) => b - a)
      return new HandRanking(HandRank.Flush, cards, values[0]!, 0, values.slice(1))
    }
    return null
  }

  private static checkStraight(cards: Card[]): HandRanking | null {
    const highCard = this.getStraightHighCard(cards)
    if (highCard !== null) {
      return new HandRanking(HandRank.Straight, cards, highCard)
    }
    return null
  }

  private static checkThreeOfAKind(cards: Card[]): HandRanking | null {
    const groups = this.groupByRank(cards)

    for (const [rank, groupCards] of groups.entries()) {
      if (groupCards.length === 3) {
        const kickers = cards
          .filter((c) => c.value !== rank)
          .map((c) => c.value)
          .sort((a, b) => b - a)
        return new HandRanking(HandRank.ThreeOfAKind, cards, rank, 0, kickers)
      }
    }
    return null
  }

  private static checkTwoPair(cards: Card[]): HandRanking | null {
    const groups = this.groupByRank(cards)
    const pairs: number[] = []

    for (const [rank, groupCards] of groups.entries()) {
      if (groupCards.length === 2) {
        pairs.push(rank)
      }
    }

    if (pairs.length === 2) {
      pairs.sort((a, b) => b - a) // Sort pairs high to low
      const kicker = cards.find((c) => !pairs.includes(c.value))?.value ?? 0
      return new HandRanking(HandRank.TwoPair, cards, pairs[0]!, pairs[1]!, [kicker])
    }
    return null
  }

  private static checkPair(cards: Card[]): HandRanking | null {
    const groups = this.groupByRank(cards)

    for (const [rank, groupCards] of groups.entries()) {
      if (groupCards.length === 2) {
        const kickers = cards
          .filter((c) => c.value !== rank)
          .map((c) => c.value)
          .sort((a, b) => b - a)
        return new HandRanking(HandRank.Pair, cards, rank, 0, kickers)
      }
    }
    return null
  }

  private static checkHighCard(cards: Card[]): HandRanking {
    const values = cards.map((c) => c.value).sort((a, b) => b - a)
    return new HandRanking(HandRank.HighCard, cards, values[0]!, 0, values.slice(1))
  }

  // ============ Helper Methods ============

  /**
   * Groups cards by rank value
   */
  private static groupByRank(cards: Card[]): Map<number, Card[]> {
    const groups = new Map<number, Card[]>()

    for (const card of cards) {
      const existing = groups.get(card.value) ?? []
      groups.set(card.value, [...existing, card])
    }

    return groups
  }

  /**
   * Checks if all cards are the same suit
   */
  private static isFlush(cards: Card[]): boolean {
    const firstSuit = cards[0]?.suit
    return cards.every((card) => card.suit === firstSuit)
  }

  /**
   * Checks if cards form a straight and returns the high card value
   * Returns null if not a straight
   */
  private static getStraightHighCard(cards: Card[]): number | null {
    const values = [...new Set(cards.map((c) => c.value))].sort((a, b) => b - a)

    // Need exactly 5 unique values for a straight
    if (values.length !== 5) {
      return null
    }

    // Check for regular straight (consecutive values)
    const isConsecutive = values.every((val, i) => {
      if (i === 0) return true
      return val === values[i - 1]! - 1
    })

    if (isConsecutive) {
      return values[0]!
    }

    // Check for wheel (A-2-3-4-5)
    if (
      values[0] === 14 && // Ace
      values[1] === 5 &&
      values[2] === 4 &&
      values[3] === 3 &&
      values[4] === 2
    ) {
      return 5 // In a wheel, 5 is the high card
    }

    return null
  }

  /**
   * Generates all 5-card combinations from 7 cards
   */
  private static get5CardCombinations(cards: Card[]): Card[][] {
    const combinations: Card[][] = []

    // Generate all combinations of 5 cards from 7
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        for (let k = j + 1; k < cards.length; k++) {
          for (let l = k + 1; l < cards.length; l++) {
            for (let m = l + 1; m < cards.length; m++) {
              combinations.push([cards[i]!, cards[j]!, cards[k]!, cards[l]!, cards[m]!])
            }
          }
        }
      }
    }

    return combinations
  }
}
