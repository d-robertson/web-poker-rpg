import { Card, Rank, Suit } from '../models/Card'
import { HandEvaluator } from './HandEvaluator'
import { HandRank } from './HandRanking'
import { ActionType, BoardTexture, HandStrength, PostFlopStrategy, StreetType } from './GTOTypes'

/**
 * Postflop strategy engine for determining GTO-based actions
 * Based on hand strength, board texture, and position
 */
export class PostFlopStrategyEngine {
  /**
   * Evaluate hand strength relative to board
   * Returns category: nuts, strong, medium, weak, or air
   */
  static evaluateHandStrength(holeCards: Card[], communityCards: Card[]): HandStrength {
    if (communityCards.length < 3) {
      return HandStrength.AIR // No flop yet
    }

    const allCards = [...holeCards, ...communityCards]
    const handRanking =
      allCards.length === 7
        ? HandEvaluator.evaluateBest7CardHand(allCards)
        : HandEvaluator.evaluateHand(allCards.slice(0, 5))

    // Categorize based on hand rank and strength
    switch (handRanking.rank) {
      case HandRank.RoyalFlush:
      case HandRank.StraightFlush:
        return HandStrength.NUTS

      case HandRank.FourOfAKind:
      case HandRank.FullHouse:
        return HandStrength.NUTS

      case HandRank.Flush:
        // Check if it's the nut flush or close to it
        if (handRanking.primaryValue >= 13) {
          // King or Ace high flush
          return HandStrength.NUTS
        }
        return HandStrength.STRONG

      case HandRank.Straight:
        // Check if it's the nut straight
        if (handRanking.primaryValue === 14) {
          // Ace-high straight
          return HandStrength.NUTS
        }
        return HandStrength.STRONG

      case HandRank.ThreeOfAKind:
        return HandStrength.STRONG

      case HandRank.TwoPair:
        // Top two pair is strong, other two pairs are medium
        if (handRanking.primaryValue >= 12) {
          // High card is Q or better
          return HandStrength.STRONG
        }
        return HandStrength.MEDIUM

      case HandRank.Pair:
        // Check if it's top pair or overpair
        const boardHighCard = Math.max(...communityCards.map((c) => c.value))
        if (handRanking.primaryValue > boardHighCard) {
          // Overpair
          return HandStrength.STRONG
        } else if (handRanking.primaryValue === boardHighCard) {
          // Top pair - check kicker
          if (handRanking.kickers[0]! >= 11) {
            // Jack or better kicker
            return HandStrength.STRONG
          }
          return HandStrength.MEDIUM
        }
        // Middle or bottom pair
        return HandStrength.WEAK

      case HandRank.HighCard:
        // Check for strong draws (flush draw, open-ended straight draw)
        const hasFlushDraw = this.hasFlushDraw(holeCards, communityCards)
        const hasStraightDraw = this.hasStraightDraw(allCards)

        if (hasFlushDraw && hasStraightDraw) {
          return HandStrength.MEDIUM // Combo draw
        } else if (hasFlushDraw || hasStraightDraw) {
          return HandStrength.WEAK // Single draw
        }

        return HandStrength.AIR

      default:
        return HandStrength.AIR
    }
  }

  /**
   * Analyze board texture
   */
  static analyzeBoardTexture(communityCards: Card[]): BoardTexture {
    if (communityCards.length < 3) {
      return BoardTexture.DRY // Default before flop
    }

    // Check for paired board
    const ranks = communityCards.map((c) => c.value)
    const uniqueRanks = new Set(ranks)
    if (uniqueRanks.size < communityCards.length) {
      return BoardTexture.PAIRED
    }

    // Check for flush draws (3+ of same suit)
    const suits = communityCards.map((c) => c.suit)
    const suitCounts = new Map<Suit, number>()
    for (const suit of suits) {
      suitCounts.set(suit, (suitCounts.get(suit) || 0) + 1)
    }
    const hasFlushDraw = Array.from(suitCounts.values()).some((count) => count >= 3)

    // Check for straight draws (connected cards)
    const sortedRanks = [...ranks].sort((a, b) => a - b)
    let maxGap = 0
    for (let i = 0; i < sortedRanks.length - 1; i++) {
      const gap = sortedRanks[i + 1]! - sortedRanks[i]!
      maxGap = Math.max(maxGap, gap)
    }
    const isConnected = maxGap <= 2 // Cards within 2 ranks of each other

    // Wet board: flush draw or connected cards
    if (hasFlushDraw || isConnected) {
      return BoardTexture.WET
    }

    // Dry board: rainbow, disconnected
    return BoardTexture.DRY
  }

  /**
   * Get postflop strategy based on situation
   * Returns action and frequency
   */
  static getStrategy(
    street: StreetType,
    handStrength: HandStrength,
    boardTexture: BoardTexture,
    isInPosition: boolean,
    facingAction: 'none' | 'bet' | 'raise'
  ): { action: ActionType; frequency: number; sizing?: number } {
    // ========== FACING NO ACTION ==========
    if (facingAction === 'none') {
      // Nuts/Strong hands - bet for value
      if (handStrength === HandStrength.NUTS || handStrength === HandStrength.STRONG) {
        return {
          action: ActionType.BET,
          frequency: boardTexture === BoardTexture.WET ? 0.8 : 0.7, // Bet more often on wet boards
          sizing: 0.66, // 2/3 pot
        }
      }

      // Medium hands - check or small bet
      if (handStrength === HandStrength.MEDIUM) {
        if (isInPosition) {
          // In position: bet for protection/value
          return {
            action: ActionType.BET,
            frequency: 0.5,
            sizing: 0.33, // 1/3 pot
          }
        } else {
          // Out of position: check more often
          return {
            action: ActionType.CHECK,
            frequency: 0.7,
          }
        }
      }

      // Weak hands/draws
      if (handStrength === HandStrength.WEAK) {
        if (isInPosition && street === StreetType.FLOP) {
          // Can bluff with position on flop
          return {
            action: ActionType.BET,
            frequency: 0.3,
            sizing: 0.33,
          }
        }
        return {
          action: ActionType.CHECK,
          frequency: 0.9,
        }
      }

      // Air - mostly check, occasional bluff
      if (isInPosition && boardTexture === BoardTexture.DRY) {
        return {
          action: ActionType.BET,
          frequency: 0.2, // Bluff occasionally on dry boards
          sizing: 0.5,
        }
      }

      return {
        action: ActionType.CHECK,
        frequency: 0.95,
      }
    }

    // ========== FACING A BET ==========
    if (facingAction === 'bet') {
      // Nuts - raise for value
      if (handStrength === HandStrength.NUTS) {
        return {
          action: ActionType.RAISE,
          frequency: 0.7,
          sizing: 2.5, // Raise to 2.5x bet
        }
      }

      // Strong hands - call or raise
      if (handStrength === HandStrength.STRONG) {
        if (isInPosition) {
          return {
            action: ActionType.CALL,
            frequency: 0.7, // Call more in position
          }
        }
        return {
          action: ActionType.CALL,
          frequency: 0.8,
        }
      }

      // Medium hands - call if price is good
      if (handStrength === HandStrength.MEDIUM) {
        return {
          action: ActionType.CALL,
          frequency: 0.4,
        }
      }

      // Weak hands - fold mostly, occasional call with draws
      if (handStrength === HandStrength.WEAK) {
        return {
          action: ActionType.FOLD,
          frequency: 0.7,
        }
      }

      // Air - fold almost always
      return {
        action: ActionType.FOLD,
        frequency: 0.95,
      }
    }

    // ========== FACING A RAISE ==========
    if (facingAction === 'raise') {
      // Only continue with very strong hands
      if (handStrength === HandStrength.NUTS) {
        return {
          action: ActionType.RAISE,
          frequency: 0.8,
          sizing: 2.5,
        }
      }

      if (handStrength === HandStrength.STRONG) {
        return {
          action: ActionType.CALL,
          frequency: 0.6,
        }
      }

      // Fold everything else
      return {
        action: ActionType.FOLD,
        frequency: 0.9,
      }
    }

    // Default: check
    return {
      action: ActionType.CHECK,
      frequency: 1.0,
    }
  }

  /**
   * Check if hand has a flush draw (4 cards to flush)
   */
  private static hasFlushDraw(holeCards: Card[], communityCards: Card[]): boolean {
    const allCards = [...holeCards, ...communityCards]
    const suitCounts = new Map<Suit, number>()

    for (const card of allCards) {
      suitCounts.set(card.suit, (suitCounts.get(card.suit) || 0) + 1)
    }

    // Check if any suit has 4+ cards (flush draw)
    return Array.from(suitCounts.values()).some((count) => count >= 4)
  }

  /**
   * Check if hand has a straight draw
   */
  private static hasStraightDraw(cards: Card[]): boolean {
    if (cards.length < 5) return false

    const values = cards.map((c) => c.value).sort((a, b) => a - b)

    // Check for 4 cards within 5-card span (open-ended or gutshot)
    for (let i = 0; i <= values.length - 4; i++) {
      const span = values[i + 3]! - values[i]!
      if (span <= 4) {
        // 4 cards within 5-rank span = some kind of straight draw
        return true
      }
    }

    return false
  }
}
