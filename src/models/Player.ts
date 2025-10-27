import { Card } from './Card'
import { ChipStack, ChipDenomination } from './Chip'

export enum PlayerAction {
  Fold = 'FOLD',
  Check = 'CHECK',
  Call = 'CALL',
  Bet = 'BET',
  Raise = 'RAISE',
  AllIn = 'ALL_IN',
}

export enum PlayerStatus {
  Active = 'ACTIVE', // Currently in the hand
  Folded = 'FOLDED', // Folded this hand
  AllIn = 'ALL_IN', // All-in this hand
  SittingOut = 'SITTING_OUT', // Not playing
  Eliminated = 'ELIMINATED', // No chips remaining
}

export class Player {
  private holeCards: Card[]
  private chipCount: number
  private currentBet: number
  private status: PlayerStatus
  private lastAction: PlayerAction | null

  constructor(
    public readonly id: string,
    public name: string,
    initialChips: number = 0
  ) {
    this.holeCards = []
    this.chipCount = initialChips
    this.currentBet = 0
    this.status = PlayerStatus.Active
    this.lastAction = null
  }

  // ============ Chip Management ============

  /**
   * Adds chips to the player's stack
   */
  addChips(amount: number): void {
    if (amount <= 0) {
      throw new Error('Cannot add zero or negative chips')
    }

    this.chipCount += amount

    // Update status if player was eliminated
    if (this.status === PlayerStatus.Eliminated && this.chips > 0) {
      this.status = PlayerStatus.Active
    }
  }

  /**
   * Removes chips from the player's stack (for betting)
   * @returns The amount actually removed
   */
  removeChips(amount: number): number {
    if (amount <= 0) {
      throw new Error('Cannot remove zero or negative chips')
    }

    const availableChips = this.chips
    const actualAmount = Math.min(amount, availableChips)

    this.chipCount -= actualAmount

    return actualAmount
  }

  /**
   * Gets the total chip count for the player
   */
  get chips(): number {
    return this.chipCount
  }

  /**
   * Gets the player's chip stack as a ChipStack object
   */
  getChipStack(): ChipStack {
    return new ChipStack(new Map([[ChipDenomination.One, this.chipCount]]))
  }

  // ============ Card Management ============

  /**
   * Receives hole cards
   */
  receiveCards(cards: Card[]): void {
    this.holeCards = [...cards]
  }

  /**
   * Gets the player's hole cards
   * Returns empty array if folded or sitting out
   */
  getHoleCards(): Card[] {
    if (this.status === PlayerStatus.Folded || this.status === PlayerStatus.SittingOut) {
      return []
    }
    return [...this.holeCards]
  }

  /**
   * Checks if player has hole cards
   */
  get hasCards(): boolean {
    return this.holeCards.length > 0
  }

  /**
   * Clears the player's hole cards (at end of hand)
   */
  clearCards(): void {
    this.holeCards = []
  }

  // ============ Betting Actions ============

  /**
   * Player folds their hand
   */
  fold(): void {
    if (this.status !== PlayerStatus.Active) {
      throw new Error(`Cannot fold: player is ${this.status}`)
    }
    this.status = PlayerStatus.Folded
    this.holeCards = [] // Clear cards when folding
    this.lastAction = PlayerAction.Fold
  }

  /**
   * Player checks (no bet required)
   */
  check(): void {
    if (this.status !== PlayerStatus.Active) {
      throw new Error(`Cannot check: player is ${this.status}`)
    }
    // Check is a no-op - validation of whether checking is legal
    // (i.e., no bet to call) should be done at the game logic level
    // by checking if callAmount === 0
    this.lastAction = PlayerAction.Check
  }

  /**
   * Player calls the current bet
   * @param betAmount The TOTAL bet amount to match (not the incremental amount to add)
   * @returns The actual amount put in (may be less if going all-in)
   */
  call(betAmount: number): number {
    if (this.status !== PlayerStatus.Active) {
      throw new Error(`Cannot call: player is ${this.status}`)
    }

    const amountNeeded = betAmount - this.currentBet
    const actualAmount = this.removeChips(amountNeeded)
    this.currentBet += actualAmount

    if (this.chips === 0) {
      this.status = PlayerStatus.AllIn
      this.lastAction = PlayerAction.AllIn
    } else {
      this.lastAction = PlayerAction.Call
    }

    return actualAmount
  }

  /**
   * Player makes a bet
   * @param amount The bet amount
   * @returns The actual amount bet
   */
  bet(amount: number): number {
    if (this.status !== PlayerStatus.Active) {
      throw new Error(`Cannot bet: player is ${this.status}`)
    }

    if (this.currentBet > 0) {
      throw new Error('Cannot bet after already betting (use raise instead)')
    }

    const actualAmount = this.removeChips(amount)
    this.currentBet = actualAmount

    if (this.chips === 0) {
      this.status = PlayerStatus.AllIn
      this.lastAction = PlayerAction.AllIn
    } else {
      this.lastAction = PlayerAction.Bet
    }

    return actualAmount
  }

  /**
   * Player raises the bet
   * @param raiseAmount The total bet amount (not the raise increment)
   * @returns The actual amount added to the pot
   */
  raise(raiseAmount: number): number {
    if (this.status !== PlayerStatus.Active) {
      throw new Error(`Cannot raise: player is ${this.status}`)
    }

    const amountNeeded = raiseAmount - this.currentBet
    const actualAmount = this.removeChips(amountNeeded)
    this.currentBet += actualAmount

    if (this.chips === 0) {
      this.status = PlayerStatus.AllIn
      this.lastAction = PlayerAction.AllIn
    } else {
      this.lastAction = PlayerAction.Raise
    }

    return actualAmount
  }

  /**
   * Player goes all-in
   * @returns The total amount pushed to the pot
   */
  allIn(): number {
    if (this.status !== PlayerStatus.Active) {
      throw new Error(`Cannot go all-in: player is ${this.status}`)
    }

    const amount = this.chips
    this.removeChips(amount)
    this.currentBet += amount
    this.status = PlayerStatus.AllIn
    this.lastAction = PlayerAction.AllIn

    return amount
  }

  /**
   * Resets the player's bet for a new betting round
   */
  resetBet(): void {
    this.currentBet = 0
    this.lastAction = null
  }

  /**
   * Gets the player's current bet amount
   */
  get currentBetAmount(): number {
    return this.currentBet
  }

  // ============ Status Management ============

  /**
   * Gets the player's current status
   */
  get playerStatus(): PlayerStatus {
    return this.status
  }

  /**
   * Checks if player is active in the current hand
   */
  get isActive(): boolean {
    return this.status === PlayerStatus.Active
  }

  /**
   * Checks if player has folded
   */
  get hasFolded(): boolean {
    return this.status === PlayerStatus.Folded
  }

  /**
   * Checks if player is all-in
   */
  get isAllIn(): boolean {
    return this.status === PlayerStatus.AllIn
  }

  /**
   * Checks if player is eliminated (no chips)
   */
  get isEliminated(): boolean {
    return this.chips === 0 || this.status === PlayerStatus.Eliminated
  }

  /**
   * Gets the player's last action
   */
  get getLastAction(): PlayerAction | null {
    return this.lastAction
  }

  /**
   * Resets player for a new hand
   */
  resetForNewHand(): void {
    this.holeCards = []
    this.currentBet = 0
    this.lastAction = null

    // Only reset status if not eliminated or sitting out
    if (this.status === PlayerStatus.Folded || this.status === PlayerStatus.AllIn) {
      this.status = this.chips > 0 ? PlayerStatus.Active : PlayerStatus.Eliminated
    }
  }

  /**
   * Sits the player out (not playing)
   */
  sitOut(): void {
    this.status = PlayerStatus.SittingOut
    this.clearCards()
  }

  /**
   * Returns the player to active status
   */
  sitIn(): void {
    if (this.chips > 0) {
      this.status = PlayerStatus.Active
    }
  }
}
