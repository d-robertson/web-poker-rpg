import { Table } from '../models/Table'
import { Dealer, WinnerResult } from '../models/Dealer'
import { Player } from '../models/Player'
import { PotManager, BettingRoundTracker, BettingRound } from './BettingStructure'
import { GameState, getNextState, isValidTransition } from './GameState'

export interface HandResult {
  winners: WinnerResult[]
  totalPot: number
  handNumber: number
}

/**
 * Manages the complete flow of a poker hand
 */
export class HandManager {
  private table: Table
  private dealer: Dealer
  private potManager: PotManager
  private currentState: GameState
  private handNumber: number
  private bettingTracker: BettingRoundTracker | null

  constructor(table: Table) {
    this.table = table
    this.dealer = new Dealer(table)
    this.potManager = new PotManager()
    this.currentState = GameState.WaitingForPlayers
    this.handNumber = 0
    this.bettingTracker = null
  }

  // ============ State Management ============

  /**
   * Gets the current game state
   */
  getState(): GameState {
    return this.currentState
  }

  /**
   * Transitions to a new state (with validation)
   */
  private setState(newState: GameState): void {
    if (!isValidTransition(this.currentState, newState)) {
      throw new Error(`Invalid state transition: ${this.currentState} -> ${newState}`)
    }
    this.currentState = newState
  }

  /**
   * Transitions to ReadyToStart state when enough players have joined
   * Idempotent - safe to call multiple times
   */
  setReadyToStart(): void {
    // Already in ReadyToStart state, nothing to do
    if (this.currentState === GameState.ReadyToStart) {
      return
    }

    if (this.currentState !== GameState.WaitingForPlayers) {
      throw new Error(`Cannot transition to ReadyToStart from state: ${this.currentState}`)
    }

    const playerCount = this.table.getActivePlayers().length
    if (playerCount < 2) {
      throw new Error('Need at least 2 players to be ready to start')
    }

    this.setState(GameState.ReadyToStart)
  }

  /**
   * Gets the current hand number
   */
  getHandNumber(): number {
    return this.handNumber
  }

  // ============ Hand Initialization ============

  /**
   * Starts a new hand
   * Posts blinds, deals hole cards, and begins preflop betting
   */
  startHand(): void {
    if (this.currentState !== GameState.ReadyToStart) {
      throw new Error(`Cannot start hand from state: ${this.currentState}`)
    }

    this.handNumber++

    // Prepare deck and reset table FIRST (must be done before checking player count)
    this.dealer.prepareNewHand()

    // Now check player count after statuses have been reset
    const playerCount = this.table.getActivePlayers().length

    if (playerCount < 2) {
      throw new Error('Need at least 2 players to start hand')
    }

    // Post blinds
    this.setState(GameState.PostingBlinds)
    this.postBlinds()

    // Deal hole cards
    this.setState(GameState.DealingHoleCards)
    this.dealer.dealHoleCards()

    // Start preflop betting
    this.setState(GameState.PreflopBetting)
    this.bettingTracker = new BettingRoundTracker(this.table, BettingRound.Preflop)
  }

  /**
   * Posts small blind and big blind
   */
  private postBlinds(): void {
    const sbPlayer = this.table.getSmallBlindPlayer()
    const bbPlayer = this.table.getBigBlindPlayer()

    if (!sbPlayer || !bbPlayer) {
      throw new Error('Cannot determine blind players')
    }

    // Post small blind
    const sbAmount = Math.min(sbPlayer.chips, this.table.config.smallBlind)
    sbPlayer.bet(sbAmount)

    // Post big blind
    const bbAmount = Math.min(bbPlayer.chips, this.table.config.bigBlind)
    bbPlayer.bet(bbAmount)
  }

  // ============ Betting Round Management ============

  /**
   * Collects current bets into the pot
   */
  collectBets(): void {
    const players = this.table.getPlayers()
    const playerBets = new Map<string, number>()
    const allInPlayers = new Set<string>()
    const foldedPlayers = new Set<string>()

    for (const player of players) {
      playerBets.set(player.id, player.currentBetAmount)

      if (player.isAllIn) {
        allInPlayers.add(player.id)
      }

      if (player.hasFolded) {
        foldedPlayers.add(player.id)
      }
    }

    // Collect bets into pot
    this.potManager.collectBets(playerBets, allInPlayers, foldedPlayers)

    // Reset player bets for next round
    for (const player of players) {
      player.resetBet()
    }
  }

  /**
   * Completes the current betting round and advances to next state
   */
  completeBettingRound(): void {
    // Collect bets
    this.collectBets()

    // Check if only one player remains (others folded)
    const activePlayers = this.table.getActivePlayers()
    if (activePlayers.length <= 1) {
      this.setState(GameState.HandComplete)
      return
    }

    // Check if all remaining players are all-in (except maybe 1)
    const playersNotAllIn = activePlayers.filter((p) => !p.isAllIn)
    if (playersNotAllIn.length === 0 || (playersNotAllIn.length === 1 && activePlayers.length > 1)) {
      // Deal out remaining cards and go to showdown
      this.dealRemainingCards()
      this.setState(GameState.Showdown)
      return
    }

    // Advance to next state based on current state
    const nextState = getNextState(this.currentState)
    this.setState(nextState)

    // If next state is a dealing state, deal the cards
    if (nextState === GameState.DealingFlop) {
      this.dealer.dealFlop()
      this.setState(GameState.FlopBetting)
      this.bettingTracker = new BettingRoundTracker(this.table, BettingRound.Flop)
    } else if (nextState === GameState.DealingTurn) {
      this.dealer.dealTurn()
      this.setState(GameState.TurnBetting)
      this.bettingTracker = new BettingRoundTracker(this.table, BettingRound.Turn)
    } else if (nextState === GameState.DealingRiver) {
      this.dealer.dealRiver()
      this.setState(GameState.RiverBetting)
      this.bettingTracker = new BettingRoundTracker(this.table, BettingRound.River)
    } else if (nextState === GameState.Showdown) {
      // River betting complete, go to showdown
      // Already in correct state
      this.bettingTracker = null
    }
  }

  /**
   * Deals remaining community cards when all players are all-in
   */
  private dealRemainingCards(): void {
    const communityCards = this.table.getCommunityCards().length

    if (communityCards < 3) {
      this.dealer.dealFlop()
    }

    if (communityCards < 4) {
      this.dealer.dealTurn()
    }

    if (communityCards < 5) {
      this.dealer.dealRiver()
    }
  }

  // ============ Showdown and Hand Completion ============

  /**
   * Performs showdown and distributes pots
   */
  performShowdown(): HandResult {
    if (this.currentState !== GameState.Showdown && this.currentState !== GameState.HandComplete) {
      throw new Error(`Cannot perform showdown from state: ${this.currentState}`)
    }

    const totalPot = this.potManager.getTotalPotAmount()

    // Determine winners and distribute pots
    const winners = this.dealer.distributePots(this.potManager)

    // Only set state to HandComplete if not already there
    if (this.currentState !== GameState.HandComplete) {
      this.setState(GameState.HandComplete)
    }

    return {
      winners,
      totalPot,
      handNumber: this.handNumber,
    }
  }

  // ============ Multi-Hand Management ============

  /**
   * Prepares for the next hand
   * Moves button, resets table, checks for eliminated players
   */
  prepareNextHand(): void {
    if (this.currentState !== GameState.HandComplete) {
      throw new Error(`Cannot prepare next hand from state: ${this.currentState}`)
    }

    // Move dealer button
    this.dealer.moveButton()

    // Reset pot manager
    this.potManager.reset()

    // Check for eliminated players (no chips)
    const players = this.table.getPlayers()
    for (const player of players) {
      if (player.isEliminated) {
        this.table.removePlayer(player.id)
      }
    }

    // Check if enough players remain
    const remainingPlayers = this.table.getPlayers().length

    if (remainingPlayers < 2) {
      this.setState(GameState.GameOver)
      return
    }

    // Ready for next hand
    this.setState(GameState.ReadyToStart)
  }

  /**
   * Checks if the game is over
   */
  isGameOver(): boolean {
    return this.currentState === GameState.GameOver || this.table.getPlayers().length < 2
  }

  /**
   * Gets the winner of the game (last player standing)
   */
  getGameWinner(): Player | null {
    const players = this.table.getPlayers()
    return players.length === 1 ? players[0]! : null
  }

  // ============ Utility ============

  /**
   * Gets the table
   */
  getTable(): Table {
    return this.table
  }

  /**
   * Gets the dealer
   */
  getDealer(): Dealer {
    return this.dealer
  }

  /**
   * Gets the pot manager
   */
  getPotManager(): PotManager {
    return this.potManager
  }

  /**
   * Gets the current pot total
   */
  getCurrentPot(): number {
    return this.potManager.getTotalPotAmount()
  }

  /**
   * Resets the game completely
   */
  reset(): void {
    this.potManager.reset()
    this.table.resetForNewHand()
    this.currentState = GameState.WaitingForPlayers
    this.handNumber = 0
    this.bettingTracker = null
  }

  // ============ Betting Action ============

  /**
   * Gets the player whose turn it is to act
   */
  getPlayerToAct(): Player | null {
    return this.bettingTracker?.getCurrentPlayer() ?? null
  }

  /**
   * Gets the amount a player needs to call
   */
  getCallAmount(player: Player): number {
    return this.bettingTracker?.getCallAmount(player) ?? 0
  }

  /**
   * Gets the current bet amount
   */
  getCurrentBet(): number {
    return this.bettingTracker?.getCurrentBet() ?? 0
  }

  /**
   * Gets the minimum raise amount
   */
  getMinRaise(): number {
    return this.bettingTracker?.getMinRaise() ?? this.table.config.bigBlind
  }

  /**
   * Records a player action (for tracking purposes)
   */
  recordPlayerAction(playerId: string, action: 'fold' | 'check' | 'call' | 'bet' | 'raise', amount?: number): void {
    if (!this.bettingTracker) {
      return
    }

    // Record the action with the betting tracker
    if (action === 'raise' || action === 'bet') {
      const player = this.table.getPlayer(playerId)
      if (player) {
        this.bettingTracker.recordAction(playerId, player.currentBetAmount)
      }
    } else {
      this.bettingTracker.recordAction(playerId)
    }
  }

  /**
   * Checks if the current betting round is complete
   */
  isBettingRoundComplete(): boolean {
    return this.bettingTracker?.isRoundComplete() ?? true
  }
}
