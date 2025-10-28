import { Player } from '../models/Player'
import { Card, createCard } from '../models/Card'
import { HandManager } from './HandManager'
import { HandRangeParser } from './HandRangeParser'
import { GTORanges } from './GTORanges'
import { PostFlopStrategyEngine } from './PostFlopStrategy'
import {
  Position,
  ActionType,
  AISkillLevel,
  DeviationBehavior,
  DecisionContext,
  StreetType,
} from './GTOTypes'

/**
 * Main GTO Decision Engine
 * Makes poker decisions based on GTO principles with skill-based adherence
 */
export class GTOEngine {
  /**
   * Make a decision for an AI player
   */
  static makeDecision(
    player: Player,
    handManager: HandManager,
    skillLevel: AISkillLevel
  ): { action: ActionType; amount?: number } {
    // Build decision context
    const context = this.buildContext(player, handManager)

    // Get GTO recommendation
    const gtoAction = this.getGTOAction(context)

    // Apply skill-based adherence
    const shouldFollowGTO = Math.random() < skillLevel.adherence

    if (shouldFollowGTO) {
      return gtoAction
    } else {
      // Deviate from GTO based on skill behavior
      return this.getDeviationAction(gtoAction, skillLevel.deviationBehavior, player, handManager)
    }
  }

  /**
   * Build decision context from current game state
   */
  private static buildContext(player: Player, handManager: HandManager): DecisionContext {
    const table = handManager['table'] // Access private field
    const communityCards = table.getCommunityCards().map((c) => c.shorthand)
    const holeCards = player.getHoleCards().map((c) => c.shorthand)

    // Determine street
    let street: StreetType
    if (communityCards.length === 0) {
      street = StreetType.PREFLOP
    } else if (communityCards.length === 3) {
      street = StreetType.FLOP
    } else if (communityCards.length === 4) {
      street = StreetType.TURN
    } else {
      street = StreetType.RIVER
    }

    // Determine position (simplified - using button distance)
    const buttonPosition = table.getButtonPosition()
    const players = table.getPlayers()
    const playerIndex = players.indexOf(player)
    const position = this.determinePosition(playerIndex, buttonPosition, players.length)

    // Determine if in position (acting after most opponents)
    const activeCount = table.getActivePlayers().length
    const isInPosition = this.isInPosition(playerIndex, buttonPosition, activeCount)

    // Determine facing action
    const currentBet = handManager.getCurrentBet()
    const callAmount = handManager.getCallAmount(player)

    let facingAction: 'none' | 'bet' | 'raise' | 'open' | '3bet'
    if (currentBet === 0) {
      facingAction = 'none'
    } else if (player.currentBetAmount === 0) {
      facingAction = 'open' // Facing initial raise
    } else {
      facingAction = 'raise' // Facing a re-raise
    }

    return {
      street,
      position,
      isInPosition,
      facingAction,
      potSize: handManager.getCurrentPot(),
      callAmount,
      playerChips: player.chips,
      playerBet: player.currentBetAmount,
      communityCards,
      holeCards,
    }
  }

  /**
   * Get GTO-recommended action
   */
  private static getGTOAction(context: DecisionContext): { action: ActionType; amount?: number } {
    if (context.street === StreetType.PREFLOP) {
      return this.getPreflopGTOAction(context)
    } else {
      return this.getPostflopGTOAction(context)
    }
  }

  /**
   * Get preflop GTO action
   */
  private static getPreflopGTOAction(context: DecisionContext): { action: ActionType; amount?: number } {
    const handNotation = HandRangeParser.cardsToHandNotation(context.holeCards[0]!, context.holeCards[1]!)

    // Facing no action - should we open?
    if (context.facingAction === 'none') {
      const openingRange = GTORanges.getRange('open', context.position)
      const shouldOpen = HandRangeParser.isHandInRange(handNotation, openingRange)

      if (shouldOpen) {
        // Open raise to 3BB (simplified)
        return {
          action: ActionType.RAISE,
          amount: context.potSize > 0 ? Math.max(15, context.potSize * 3) : 15,
        }
      } else {
        return { action: ActionType.FOLD }
      }
    }

    // Facing an open - should we 3-bet, call, or fold?
    if (context.facingAction === 'open') {
      const threeBetRange = GTORanges.getRange('3bet', context.position)
      const callingRange = GTORanges.getRange('call', context.position)

      if (HandRangeParser.isHandInRange(handNotation, threeBetRange)) {
        // 3-bet to 3x the raise
        return {
          action: ActionType.RAISE,
          amount: context.callAmount * 3,
        }
      } else if (HandRangeParser.isHandInRange(handNotation, callingRange)) {
        return { action: ActionType.CALL }
      } else {
        return { action: ActionType.FOLD }
      }
    }

    // Facing a 3-bet - should we 4-bet, call, or fold?
    if (context.facingAction === 'raise' || context.facingAction === '3bet') {
      const fourBetRange = GTORanges.getRange('4bet', context.position)

      if (HandRangeParser.isHandInRange(handNotation, fourBetRange)) {
        // 4-bet to 2.5x the 3-bet
        return {
          action: ActionType.RAISE,
          amount: context.callAmount * 2.5,
        }
      }

      // Call with some strong hands (simplified - just premium pairs and AK)
      const callRange = ['QQ', 'JJ', 'TT', 'AKs', 'AQs']
      if (HandRangeParser.isHandInRange(handNotation, callRange)) {
        return { action: ActionType.CALL }
      }

      return { action: ActionType.FOLD }
    }

    // Default: fold
    return { action: ActionType.FOLD }
  }

  /**
   * Get postflop GTO action
   */
  private static getPostflopGTOAction(context: DecisionContext): { action: ActionType; amount?: number } {
    // Convert card shorthands to Card objects
    const holeCards = context.holeCards.map((sh) => createCard(sh))
    const communityCards = context.communityCards.map((sh) => createCard(sh))

    // Evaluate hand strength and board texture
    const handStrength = PostFlopStrategyEngine.evaluateHandStrength(holeCards, communityCards)
    const boardTexture = PostFlopStrategyEngine.analyzeBoardTexture(communityCards)

    // Get strategy recommendation
    const strategy = PostFlopStrategyEngine.getStrategy(
      context.street,
      handStrength,
      boardTexture,
      context.isInPosition,
      context.facingAction === 'none' ? 'none' : context.facingAction === 'open' ? 'bet' : 'raise'
    )

    // Apply frequency - roll dice to see if we take this action
    const shouldTakeAction = Math.random() < strategy.frequency

    if (!shouldTakeAction) {
      // Don't take the recommended action - do something else
      if (strategy.action === ActionType.BET || strategy.action === ActionType.RAISE) {
        return { action: ActionType.CHECK }
      } else if (strategy.action === ActionType.CALL) {
        return { action: ActionType.FOLD }
      } else {
        // Was checking or folding, stick with it
        return { action: strategy.action }
      }
    }

    // Take the recommended action
    if (strategy.action === ActionType.BET) {
      const betSize = context.potSize * (strategy.sizing || 0.66)
      return {
        action: ActionType.BET,
        amount: Math.max(10, Math.min(betSize, context.playerChips)),
      }
    }

    if (strategy.action === ActionType.RAISE) {
      const raiseSize = context.callAmount * (strategy.sizing || 2.5)
      return {
        action: ActionType.RAISE,
        amount: Math.max(context.callAmount * 2, Math.min(raiseSize, context.playerChips)),
      }
    }

    return { action: strategy.action }
  }

  /**
   * Get deviation action when not following GTO
   */
  private static getDeviationAction(
    gtoAction: { action: ActionType; amount?: number },
    behavior: DeviationBehavior,
    player: Player,
    handManager: HandManager
  ): { action: ActionType; amount?: number } {
    const callAmount = handManager.getCallAmount(player)
    const minRaise = handManager.getMinRaise()

    switch (behavior) {
      case DeviationBehavior.PASSIVE:
        // Make more passive choices
        if (gtoAction.action === ActionType.BET || gtoAction.action === ActionType.RAISE) {
          // Should bet/raise → check/call instead
          if (callAmount === 0) {
            return { action: ActionType.CHECK }
          } else {
            return { action: ActionType.CALL }
          }
        } else if (gtoAction.action === ActionType.CALL) {
          // Should call → sometimes fold
          if (Math.random() < 0.3) {
            return { action: ActionType.FOLD }
          }
        }
        return gtoAction

      case DeviationBehavior.AGGRESSIVE:
        // Make more aggressive choices
        if (gtoAction.action === ActionType.CHECK) {
          // Should check → sometimes bet
          if (Math.random() < 0.4 && player.chips >= minRaise) {
            return { action: ActionType.BET, amount: minRaise }
          }
        } else if (gtoAction.action === ActionType.CALL && player.chips >= minRaise) {
          // Should call → sometimes raise
          if (Math.random() < 0.3) {
            return { action: ActionType.RAISE, amount: minRaise }
          }
        }
        return gtoAction

      case DeviationBehavior.RANDOM:
        // Pick a random legal action
        const legalActions: ActionType[] = [ActionType.FOLD]

        if (callAmount === 0) {
          legalActions.push(ActionType.CHECK)
        } else {
          legalActions.push(ActionType.CALL)
        }

        if (player.chips > 0) {
          if (callAmount === 0) {
            legalActions.push(ActionType.BET)
          } else if (player.chips >= minRaise) {
            legalActions.push(ActionType.RAISE)
          }
        }

        const randomAction = legalActions[Math.floor(Math.random() * legalActions.length)]!

        if (randomAction === ActionType.BET || randomAction === ActionType.RAISE) {
          return { action: randomAction, amount: minRaise }
        }

        return { action: randomAction }

      default:
        return gtoAction
    }
  }

  /**
   * Determine position based on seat index and button position
   */
  private static determinePosition(seatIndex: number, buttonPosition: number, totalPlayers: number): Position {
    const relativePosition = (seatIndex - buttonPosition + totalPlayers) % totalPlayers

    if (relativePosition === 0) return Position.BTN
    if (relativePosition === 1) return Position.SB
    if (relativePosition === 2) return Position.BB

    // For 6-max
    if (totalPlayers <= 6) {
      if (relativePosition === 3) return Position.UTG
      if (relativePosition === 4) return Position.HJ
      if (relativePosition === 5) return Position.CO
    } else {
      // For full ring (7-9 players)
      if (relativePosition === 3) return Position.UTG
      if (relativePosition === 4) return Position.UTG1
      if (relativePosition === 5) return Position.MP
      if (relativePosition === 6) return Position.LJ
      if (relativePosition === 7) return Position.HJ
      if (relativePosition === 8) return Position.CO
    }

    return Position.MP // Default
  }

  /**
   * Determine if player is in position (acts after most opponents)
   */
  private static isInPosition(seatIndex: number, buttonPosition: number, totalPlayers: number): boolean {
    const relativePosition = (seatIndex - buttonPosition + totalPlayers) % totalPlayers
    // Button, CO, HJ are generally "in position"
    return relativePosition <= 3 || relativePosition >= totalPlayers - 2
  }
}
