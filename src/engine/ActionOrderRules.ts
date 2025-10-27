import { Player } from '../models/Player'
import { Table } from '../models/Table'

/**
 * Defines the rules for poker action order
 * This is the single source of truth for how betting order works
 */

export enum BettingStreet {
  Preflop = 'PREFLOP',
  Flop = 'FLOP',
  Turn = 'TURN',
  River = 'RIVER',
}

/**
 * Action Order Rules:
 *
 * PREFLOP:
 * - Heads-up (2 players): SB (also button) acts first, BB acts last
 * - 3+ players: Player left of BB (UTG) acts first, action goes clockwise ending at BB
 *
 * POST-FLOP (Flop, Turn, River):
 * - All scenarios: First active player left of button acts first, button acts last
 * - Action goes clockwise from first player left of button
 */

export interface ActionOrderResult {
  /** Array of player IDs in the order they should act */
  playerOrder: string[]
  /** The current bet amount at the start of this betting round */
  startingBet: number
}

export class ActionOrderRules {
  /**
   * Gets the action order for a betting round
   * This is the main entry point - all action order logic goes through here
   */
  static getActionOrder(
    table: Table,
    street: BettingStreet
  ): ActionOrderResult {
    const activePlayers = table.getActivePlayers()

    if (activePlayers.length === 0) {
      return { playerOrder: [], startingBet: 0 }
    }

    if (street === BettingStreet.Preflop) {
      return this.getPreflopOrder(table, activePlayers)
    } else {
      return this.getPostFlopOrder(table, activePlayers)
    }
  }

  /**
   * PREFLOP ACTION ORDER
   *
   * Rules:
   * - 2 players: SB acts first (SB is also button in heads-up)
   * - 3+ players: Player immediately left of BB acts first (UTG)
   * - Action continues clockwise
   * - BB acts last (gets option to raise)
   */
  private static getPreflopOrder(
    table: Table,
    activePlayers: Player[]
  ): ActionOrderResult {
    const buttonPos = table.getButtonPosition()
    const bbPos = table.getBigBlindPosition()
    const bbPlayer = table.getBigBlindPlayer()
    const allPlayers = table.getPlayers()
    const maxSeats = table.config.maxSeats

    // Get positions of active players
    const activePositions = activePlayers.map(p =>
      allPlayers.findIndex(player => player.id === p.id)
    ).filter(pos => pos !== -1)

    let orderedPositions: number[]

    if (activePlayers.length === 2) {
      // HEADS-UP: Button (SB) acts first, BB acts last
      orderedPositions = this.sortByDistanceFromPosition(
        activePositions,
        buttonPos,
        maxSeats
      )
    } else {
      // 3+ PLAYERS: UTG (left of BB) acts first
      // Find the player immediately left of BB
      orderedPositions = this.sortByDistanceFromPosition(
        activePositions,
        bbPos,
        maxSeats
      )
      // Remove positions with distance 0 (BB) and move to end
      const bbIndex = orderedPositions.indexOf(bbPos)
      if (bbIndex === 0) {
        // BB is first in sorted order, move to end
        orderedPositions = [
          ...orderedPositions.slice(1),
          orderedPositions[0]!
        ]
      }
    }

    // Convert positions to player IDs
    const playerOrder = orderedPositions
      .map(pos => allPlayers[pos]?.id)
      .filter((id): id is string => id !== undefined)

    return {
      playerOrder,
      startingBet: bbPlayer?.currentBetAmount ?? 0
    }
  }

  /**
   * POST-FLOP ACTION ORDER (Flop, Turn, River)
   *
   * Rules:
   * - First active player left of button acts first
   * - Action continues clockwise
   * - Button acts last (best position)
   */
  private static getPostFlopOrder(
    table: Table,
    activePlayers: Player[]
  ): ActionOrderResult {
    const buttonPos = table.getButtonPosition()
    const allPlayers = table.getPlayers()
    const maxSeats = table.config.maxSeats

    // Get positions of active players
    const activePositions = activePlayers.map(p =>
      allPlayers.findIndex(player => player.id === p.id)
    ).filter(pos => pos !== -1)

    // Sort by distance from button (clockwise)
    let orderedPositions = this.sortByDistanceFromPosition(
      activePositions,
      buttonPos,
      maxSeats
    )

    // Button should be last, so if button is at index 0 (distance 0), move to end
    const buttonIndex = orderedPositions.indexOf(buttonPos)
    if (buttonIndex === 0 && orderedPositions.length > 1) {
      orderedPositions = [
        ...orderedPositions.slice(1),
        orderedPositions[0]!
      ]
    }

    // Convert positions to player IDs
    const playerOrder = orderedPositions
      .map(pos => allPlayers[pos]?.id)
      .filter((id): id is string => id !== undefined)

    return {
      playerOrder,
      startingBet: 0  // Post-flop starts with no bet
    }
  }

  /**
   * Sorts positions by their clockwise distance from a starting position
   * Positions closer to the start position come first
   */
  private static sortByDistanceFromPosition(
    positions: number[],
    startPos: number,
    maxSeats: number
  ): number[] {
    return [...positions].sort((a, b) => {
      const distA = (a - startPos + maxSeats) % maxSeats
      const distB = (b - startPos + maxSeats) % maxSeats
      return distA - distB
    })
  }

  /**
   * Validates that the action order rules are being followed
   * Useful for debugging and testing
   */
  static validateActionOrder(
    table: Table,
    street: BettingStreet,
    expectedOrder: string[]
  ): boolean {
    const result = this.getActionOrder(table, street)
    return JSON.stringify(result.playerOrder) === JSON.stringify(expectedOrder)
  }

  /**
   * Gets a human-readable explanation of the action order
   * Useful for debugging and logging
   */
  static explainActionOrder(
    table: Table,
    street: BettingStreet
  ): string {
    const result = this.getActionOrder(table, street)
    const players = result.playerOrder.map(id => {
      const player = table.getPlayer(id)
      return player ? player.name : 'Unknown'
    })

    let explanation = `${street} Action Order:\n`
    players.forEach((name, index) => {
      explanation += `  ${index + 1}. ${name}\n`
    })
    explanation += `Starting bet: $${result.startingBet}`

    return explanation
  }
}
