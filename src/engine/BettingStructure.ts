import { Player } from '../models/Player'
import { Table } from '../models/Table'
import { ActionOrderRules, BettingStreet } from './ActionOrderRules'

/**
 * Represents the different betting rounds in Texas Hold'em
 */
export enum BettingRound {
  Preflop = 'PREFLOP',
  Flop = 'FLOP',
  Turn = 'TURN',
  River = 'RIVER',
  Showdown = 'SHOWDOWN',
}

/** Maps BettingRound to BettingStreet for the rules system */
function toStreet(round: BettingRound): BettingStreet | null {
  switch (round) {
    case BettingRound.Preflop: return BettingStreet.Preflop
    case BettingRound.Flop: return BettingStreet.Flop
    case BettingRound.Turn: return BettingStreet.Turn
    case BettingRound.River: return BettingStreet.River
    default: return null
  }
}

/**
 * Tracks the action order and state during a betting round
 */
export class BettingRoundTracker {
  private table: Table
  private round: BettingRound
  private currentBetAmount: number
  private lastRaiserPosition: number
  private playerIdOrder: string[] // Player IDs in action order
  private currentActionIndex: number
  private playersActed: Set<string>

  constructor(table: Table, round: BettingRound) {
    this.table = table
    this.round = round
    this.currentBetAmount = 0
    this.lastRaiserPosition = -1
    this.playerIdOrder = []
    this.currentActionIndex = 0
    this.playersActed = new Set()

    this.initializeActionOrder()
  }

  /**
   * Initializes the action order using ActionOrderRules
   * All the complex logic is now centralized in ActionOrderRules
   */
  private initializeActionOrder(): void {
    const street = toStreet(this.round)

    if (!street) {
      // Not a betting round (e.g., Showdown)
      this.playerIdOrder = []
      this.currentBetAmount = 0
      return
    }

    // Use the centralized rules system
    const orderResult = ActionOrderRules.getActionOrder(this.table, street)

    this.playerIdOrder = orderResult.playerOrder
    this.currentBetAmount = orderResult.startingBet
    this.currentActionIndex = 0

    // Optional: Log the action order for debugging
    if (process.env.NODE_ENV !== 'test') {
      console.log(`🎯 ${this.round} action order:`, this.playerIdOrder.map(id => {
        const player = this.table.getPlayer(id)
        return player?.name || id
      }).join(' → '))
    }
  }

  /**
   * Gets the player whose turn it is to act
   */
  getCurrentPlayer(): Player | null {
    // If we've gone past the initial action order, we need to loop back
    // to give players a chance to respond to bets/raises
    if (this.currentActionIndex >= this.playerIdOrder.length) {
      // Find the next player who needs to act (hasn't matched the current bet)
      const nextPlayer = this.findNextPlayerToAct()
      if (!nextPlayer) {
        return null // No one needs to act
      }

      // Reset index to this player's position in the action order
      this.currentActionIndex = this.playerIdOrder.indexOf(nextPlayer.id)
      if (this.currentActionIndex === -1) {
        return null // Player not in action order
      }
    }

    const playerId = this.playerIdOrder[this.currentActionIndex]!
    const player = this.table.getPlayer(playerId)

    if (!player) {
      // Player not found, advance to next
      this.advanceToNextPlayer()
      return this.getCurrentPlayer()
    }

    // Skip if player is no longer active
    if (player.hasFolded || player.isAllIn) {
      this.advanceToNextPlayer()
      return this.getCurrentPlayer()
    }

    // Skip if player has already matched the current bet
    if (player.currentBetAmount >= this.currentBetAmount && this.playersActed.has(player.id)) {
      this.advanceToNextPlayer()
      return this.getCurrentPlayer()
    }

    return player
  }

  /**
   * Finds the next player who needs to act (hasn't matched current bet)
   */
  private findNextPlayerToAct(): Player | null {
    for (const playerId of this.playerIdOrder) {
      const player = this.table.getPlayer(playerId)
      if (!player) continue

      // Skip folded or all-in players
      if (player.hasFolded || player.isAllIn) continue

      // This player needs to act if they haven't matched the current bet
      if (player.currentBetAmount < this.currentBetAmount) {
        return player
      }
    }

    return null
  }

  /**
   * Records a player action and advances to the next player
   */
  recordAction(playerId: string, raisedAmount?: number): void {
    const player = this.table.getPlayer(playerId)

    if (!player) {
      throw new Error(`Player ${playerId} not found`)
    }

    this.playersActed.add(playerId)

    // If this was a raise, update current bet and last raiser
    if (raisedAmount !== undefined && raisedAmount > this.currentBetAmount) {
      this.currentBetAmount = raisedAmount
      const allPlayers = this.table.getPlayers()
      this.lastRaiserPosition = allPlayers.findIndex(p => p.id === playerId)
    }

    this.advanceToNextPlayer()
  }

  /**
   * Moves to the next player in action order
   */
  private advanceToNextPlayer(): void {
    this.currentActionIndex++
  }

  /**
   * Checks if the betting round is complete
   */
  isRoundComplete(): boolean {
    const activePlayers = this.table.getActivePlayers()

    // Need at least 2 players who can still act
    const playersWhoCanAct = activePlayers.filter(p => !p.isAllIn && !p.hasFolded)

    if (playersWhoCanAct.length <= 1) {
      return true // Only 0-1 players can act, round is over
    }

    // Check if all players have matched the current bet or folded/all-in
    // This is the definitive check - if everyone has matched, round is complete
    for (const player of activePlayers) {
      if (player.hasFolded || player.isAllIn) {
        continue
      }

      if (player.currentBetAmount < this.currentBetAmount) {
        return false // Player hasn't matched the current bet
      }
    }

    // Additionally, everyone who needs to act must have acted at least once
    for (const player of activePlayers) {
      if (player.hasFolded || player.isAllIn) {
        continue
      }

      if (!this.playersActed.has(player.id)) {
        return false // Player hasn't had a chance to act yet
      }
    }

    return true
  }

  /**
   * Gets the current bet amount to call
   */
  getCurrentBet(): number {
    return this.currentBetAmount
  }

  /**
   * Gets the amount a specific player needs to call
   */
  getCallAmount(player: Player): number {
    return Math.max(0, this.currentBetAmount - player.currentBetAmount)
  }

  /**
   * Gets the minimum raise amount
   */
  getMinRaise(): number {
    // Minimum raise is typically the size of the big blind or the size of the last raise
    const bbAmount = this.table.config.bigBlind
    return this.currentBetAmount + bbAmount
  }

  /**
   * Gets the action order as player IDs (for debugging)
   */
  getActionOrder(): string[] {
    return [...this.playerIdOrder]
  }
}

/**
 * Represents a player's contribution to a pot
 */
export interface PlayerContribution {
  playerId: string
  amount: number
}

/**
 * Represents a pot in the game (main pot or side pot)
 */
export class Pot {
  private contributions: Map<string, number>
  private eligiblePlayerIds: Set<string>

  constructor(eligiblePlayers?: string[]) {
    this.contributions = new Map()
    this.eligiblePlayerIds = new Set(eligiblePlayers ?? [])
  }

  /**
   * Adds a contribution to the pot from a player
   */
  addContribution(playerId: string, amount: number): void {
    if (amount <= 0) {
      throw new Error('Contribution must be positive')
    }

    const currentAmount = this.contributions.get(playerId) ?? 0
    this.contributions.set(playerId, currentAmount + amount)

    // Add player to eligible list if not already there
    if (!this.eligiblePlayerIds.has(playerId)) {
      this.eligiblePlayerIds.add(playerId)
    }
  }

  /**
   * Gets the total amount in the pot
   */
  get total(): number {
    let sum = 0
    for (const amount of this.contributions.values()) {
      sum += amount
    }
    return sum
  }

  /**
   * Gets the contribution amount for a specific player
   */
  getPlayerContribution(playerId: string): number {
    return this.contributions.get(playerId) ?? 0
  }

  /**
   * Gets all player contributions
   */
  getAllContributions(): PlayerContribution[] {
    return Array.from(this.contributions.entries()).map(([playerId, amount]) => ({
      playerId,
      amount,
    }))
  }

  /**
   * Checks if a player is eligible to win this pot
   */
  isPlayerEligible(playerId: string): boolean {
    return this.eligiblePlayerIds.has(playerId)
  }

  /**
   * Gets all eligible player IDs
   */
  getEligiblePlayers(): string[] {
    return Array.from(this.eligiblePlayerIds)
  }

  /**
   * Removes a player from eligibility (e.g., when they fold)
   */
  removePlayerEligibility(playerId: string): void {
    this.eligiblePlayerIds.delete(playerId)
  }

  /**
   * Clears the pot
   */
  clear(): void {
    this.contributions.clear()
    this.eligiblePlayerIds.clear()
  }
}

/**
 * Manages multiple pots (main pot and side pots)
 */
export class PotManager {
  private mainPot: Pot
  private sidePots: Pot[]

  constructor() {
    this.mainPot = new Pot()
    this.sidePots = []
  }

  /**
   * Adds contributions from players and creates side pots if necessary
   * @param playerBets Map of player ID to their bet amount
   * @param allInPlayers Set of player IDs who are all-in
   * @param foldedPlayers Set of player IDs who have folded
   */
  collectBets(
    playerBets: Map<string, number>,
    allInPlayers: Set<string>,
    foldedPlayers: Set<string>
  ): void {
    if (playerBets.size === 0) {
      return
    }

    // Get unique bet amounts, sorted ascending
    const uniqueBetAmounts = [
      ...new Set(Array.from(playerBets.values()).filter((amt) => amt > 0)),
    ].sort((a, b) => a - b)

    if (uniqueBetAmounts.length === 0) {
      return
    }

    // Track how much each player has left to contribute
    const remainingContributions = new Map(playerBets)

    // Process each bet level to create pots
    for (let i = 0; i < uniqueBetAmounts.length; i++) {
      const currentLevel = uniqueBetAmounts[i]!
      const previousLevel = i > 0 ? uniqueBetAmounts[i - 1]! : 0
      const contributionAmount = currentLevel - previousLevel

      // Find all players who can contribute at this level
      const contributingPlayers = Array.from(remainingContributions.entries())
        .filter(([_, remaining]) => remaining >= contributionAmount)
        .map(([id]) => id)

      if (contributingPlayers.length === 0) continue

      // Determine eligible players (not folded)
      const eligiblePlayers = contributingPlayers.filter((id) => !foldedPlayers.has(id))

      // Create pot
      const pot = new Pot(eligiblePlayers)

      // Collect contributions
      for (const playerId of contributingPlayers) {
        pot.addContribution(playerId, contributionAmount)
        const remaining = remainingContributions.get(playerId)!
        remainingContributions.set(playerId, remaining - contributionAmount)
      }

      // Remove folded players from eligibility (they contributed but can't win)
      for (const foldedId of foldedPlayers) {
        pot.removePlayerEligibility(foldedId)
      }

      // Add pot to main or side pots
      if (this.mainPot.total === 0) {
        this.mainPot = pot
      } else {
        this.sidePots.push(pot)
      }
    }
  }

  /**
   * Distributes pots to winners
   * @param winners Array of winner objects with playerId and hand ranking
   * @returns Map of player ID to amount won
   */
  distributePots(winners: Array<{ playerId: string }>): Map<string, number> {
    const winnings = new Map<string, number>()

    // Distribute main pot
    this.distributeSinglePot(this.mainPot, winners, winnings)

    // Distribute side pots
    for (const sidePot of this.sidePots) {
      this.distributeSinglePot(sidePot, winners, winnings)
    }

    return winnings
  }

  /**
   * Distributes a single pot to eligible winners
   */
  private distributeSinglePot(
    pot: Pot,
    winners: Array<{ playerId: string }>,
    winnings: Map<string, number>
  ): void {
    if (pot.total === 0) return

    // Find eligible winners for this pot
    const eligibleWinners = winners.filter((w) => pot.isPlayerEligible(w.playerId))

    if (eligibleWinners.length === 0) {
      // No eligible winners (all folded) - pot stays (shouldn't happen in practice)
      return
    }

    // Split pot evenly among winners
    const amountPerWinner = Math.floor(pot.total / eligibleWinners.length)
    const remainder = pot.total % eligibleWinners.length

    for (let i = 0; i < eligibleWinners.length; i++) {
      const winner = eligibleWinners[i]!
      const currentWinnings = winnings.get(winner.playerId) ?? 0

      // First winner gets the remainder (odd chip rule)
      const amount = i === 0 ? amountPerWinner + remainder : amountPerWinner

      winnings.set(winner.playerId, currentWinnings + amount)
    }
  }

  /**
   * Gets the main pot
   */
  getMainPot(): Pot {
    return this.mainPot
  }

  /**
   * Gets all side pots
   */
  getSidePots(): Pot[] {
    return [...this.sidePots]
  }

  /**
   * Gets the total amount in all pots
   */
  getTotalPotAmount(): number {
    let total = this.mainPot.total
    for (const sidePot of this.sidePots) {
      total += sidePot.total
    }
    return total
  }

  /**
   * Gets the number of side pots
   */
  getSidePotCount(): number {
    return this.sidePots.length
  }

  /**
   * Resets all pots
   */
  reset(): void {
    this.mainPot = new Pot()
    this.sidePots = []
  }
}
