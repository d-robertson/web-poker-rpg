import { Player } from '../models/Player'
import { HandManager } from './HandManager'

/**
 * Simple AI decision making for poker players
 */
export class AIPlayer {
  /**
   * Makes a decision for an AI player
   * Returns the action and optional amount
   */
  static makeDecision(
    player: Player,
    handManager: HandManager
  ): { action: 'fold' | 'check' | 'call' | 'bet' | 'raise'; amount?: number; callAmount?: number } {
    const callAmount = handManager.getCallAmount(player)
    const currentBet = handManager.getCurrentBet()
    const minRaise = handManager.getMinRaise()

    // Simple decision logic based on call amount and position
    const potOdds = callAmount / (handManager.getCurrentPot() + callAmount || 1)

    // Very simple AI logic - just for basic gameplay
    // In a real implementation, this would use hand strength evaluation

    // If no bet to call (can check)
    if (callAmount === 0) {
      // 30% chance to bet/raise, 70% chance to check
      if (Math.random() < 0.3 && player.chips >= minRaise) {
        // If player already has a bet (like BB with blind), use raise instead of bet
        if (player.currentBetAmount > 0) {
          return { action: 'raise', amount: minRaise, callAmount: 0 }
        }
        return { action: 'bet', amount: minRaise, callAmount: 0 }
      }
      return { action: 'check', callAmount: 0 }
    }

    // If there's a bet to call
    if (callAmount > 0) {
      // Can't afford to call
      if (callAmount > player.chips) {
        // Go all-in if the pot odds are good (simplified)
        if (potOdds < 0.3) {
          return { action: 'call', callAmount } // Will go all-in
        }
        return { action: 'fold' }
      }

      // Decide based on pot odds and randomness
      if (potOdds > 0.5) {
        // Bad pot odds - fold more often
        if (Math.random() < 0.7) {
          return { action: 'fold' }
        }
        return { action: 'call', callAmount }
      } else if (potOdds > 0.3) {
        // Medium pot odds - mostly call, sometimes fold
        if (Math.random() < 0.2) {
          return { action: 'fold' }
        } else if (Math.random() < 0.8) {
          return { action: 'call', callAmount }
        } else if (player.chips >= minRaise) {
          return { action: 'raise', amount: minRaise }
        }
        return { action: 'call', callAmount }
      } else {
        // Good pot odds - mostly call/raise
        if (Math.random() < 0.6) {
          return { action: 'call', callAmount }
        } else if (player.chips >= minRaise) {
          return { action: 'raise', amount: minRaise }
        }
        return { action: 'call', callAmount }
      }
    }

    // Default: check if possible, otherwise fold
    return callAmount === 0 ? { action: 'check', callAmount: 0 } : { action: 'fold' }
  }

  /**
   * Executes an AI player's action
   */
  static executeAction(
    player: Player,
    decision: { action: 'fold' | 'check' | 'call' | 'bet' | 'raise'; amount?: number },
    handManager: HandManager,
    recordAction: (playerId: string, action: 'fold' | 'check' | 'call' | 'bet' | 'raise', amount?: number) => void
  ): void {
    // Execute the action on the player
    switch (decision.action) {
      case 'fold':
        player.fold()
        break
      case 'check':
        player.check()
        break
      case 'call': {
        // player.call() expects the TOTAL bet amount to match, not the incremental amount
        const currentBet = handManager.getCurrentBet()
        player.call(currentBet)
        break
      }
      case 'bet':
        if (decision.amount !== undefined) {
          player.bet(decision.amount)
        }
        break
      case 'raise':
        if (decision.amount !== undefined) {
          player.raise(decision.amount)
        }
        break
    }

    // Record the action with the hand manager
    recordAction(player.id, decision.action, decision.amount)
  }
}
