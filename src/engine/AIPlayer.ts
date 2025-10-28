import { Player } from '../models/Player'
import { HandManager } from './HandManager'
import { GTOEngine } from './GTOEngine'
import { AISkillLevel, SKILL_LEVELS, ActionType } from './GTOTypes'

/**
 * GTO-based AI decision making for poker players
 * Uses realistic poker strategy with skill-based adherence
 */
export class AIPlayer {
  // Store skill levels for each AI player
  private static playerSkills = new Map<string, AISkillLevel>()

  /**
   * Assign a skill level to an AI player
   */
  static assignSkillLevel(playerId: string, skillLevel: AISkillLevel): void {
    this.playerSkills.set(playerId, skillLevel)
  }

  /**
   * Get skill level for a player (defaults to intermediate if not set)
   */
  static getSkillLevel(playerId: string): AISkillLevel {
    return this.playerSkills.get(playerId) || SKILL_LEVELS.INTERMEDIATE
  }

  /**
   * Makes a decision for an AI player using GTO engine
   * Returns the action and optional amount
   */
  static makeDecision(
    player: Player,
    handManager: HandManager
  ): { action: 'fold' | 'check' | 'call' | 'bet' | 'raise'; amount?: number; callAmount?: number } {
    const skillLevel = this.getSkillLevel(player.id)
    const callAmount = handManager.getCallAmount(player)

    // Use GTO engine to make decision
    const decision = GTOEngine.makeDecision(player, handManager, skillLevel)

    // Convert ActionType enum to string for compatibility
    let action: 'fold' | 'check' | 'call' | 'bet' | 'raise'
    switch (decision.action) {
      case ActionType.FOLD:
        action = 'fold'
        break
      case ActionType.CHECK:
        action = 'check'
        break
      case ActionType.CALL:
        action = 'call'
        break
      case ActionType.BET:
        action = 'bet'
        break
      case ActionType.RAISE:
        action = 'raise'
        break
      default:
        action = 'fold'
    }

    return {
      action,
      amount: decision.amount,
      callAmount,
    }
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
