export interface Transaction {
  id: string
  playerId: string
  type: 'buy-in' | 'cash-out'
  amount: number
  timestamp: Date
}

export interface PlayerBankroll {
  playerId: string
  playerName: string
  cash: number
  chips: number
}

/**
 * Cashier manages player bankrolls and chip transactions
 */
export class Cashier {
  private bankrolls: Map<string, PlayerBankroll>
  private transactions: Transaction[]
  private nextTransactionId: number

  constructor() {
    this.bankrolls = new Map()
    this.transactions = []
    this.nextTransactionId = 1
  }

  // ============ Bankroll Management ============

  /**
   * Registers a new player with starting cash
   */
  registerPlayer(playerId: string, playerName: string, startingCash: number): PlayerBankroll {
    if (this.bankrolls.has(playerId)) {
      throw new Error(`Player ${playerId} is already registered`)
    }

    if (startingCash < 0) {
      throw new Error('Starting cash cannot be negative')
    }

    const bankroll: PlayerBankroll = {
      playerId,
      playerName,
      cash: startingCash,
      chips: 0,
    }

    this.bankrolls.set(playerId, bankroll)
    return bankroll
  }

  /**
   * Gets a player's bankroll
   */
  getPlayerBankroll(playerId: string): PlayerBankroll | null {
    return this.bankrolls.get(playerId) ?? null
  }

  /**
   * Gets all player bankrolls
   */
  getAllBankrolls(): PlayerBankroll[] {
    return Array.from(this.bankrolls.values())
  }

  /**
   * Gets total worth (cash + chips) for a player
   */
  getPlayerTotalWorth(playerId: string): number {
    const bankroll = this.bankrolls.get(playerId)
    if (!bankroll) {
      return 0
    }
    return bankroll.cash + bankroll.chips
  }

  // ============ Buy-In / Cash-Out ============

  /**
   * Processes a buy-in (converts cash to chips)
   */
  buyIn(playerId: string, amount: number): Transaction {
    const bankroll = this.bankrolls.get(playerId)
    if (!bankroll) {
      throw new Error(`Player ${playerId} not found`)
    }

    if (amount <= 0) {
      throw new Error('Buy-in amount must be positive')
    }

    if (amount > bankroll.cash) {
      throw new Error(
        `Insufficient cash. Player has ${bankroll.cash} but tried to buy-in for ${amount}`
      )
    }

    // Convert cash to chips
    bankroll.cash -= amount
    bankroll.chips += amount

    // Record transaction
    const transaction: Transaction = {
      id: `txn-${this.nextTransactionId++}`,
      playerId,
      type: 'buy-in',
      amount,
      timestamp: new Date(),
    }
    this.transactions.push(transaction)

    return transaction
  }

  /**
   * Processes a cash-out (converts chips to cash)
   */
  cashOut(playerId: string, amount: number): Transaction {
    const bankroll = this.bankrolls.get(playerId)
    if (!bankroll) {
      throw new Error(`Player ${playerId} not found`)
    }

    if (amount <= 0) {
      throw new Error('Cash-out amount must be positive')
    }

    if (amount > bankroll.chips) {
      throw new Error(
        `Insufficient chips. Player has ${bankroll.chips} but tried to cash-out ${amount}`
      )
    }

    // Convert chips to cash
    bankroll.chips -= amount
    bankroll.cash += amount

    // Record transaction
    const transaction: Transaction = {
      id: `txn-${this.nextTransactionId++}`,
      playerId,
      type: 'cash-out',
      amount,
      timestamp: new Date(),
    }
    this.transactions.push(transaction)

    return transaction
  }

  /**
   * Adds cash to a player's bankroll (e.g., reload)
   */
  addCash(playerId: string, amount: number): void {
    const bankroll = this.bankrolls.get(playerId)
    if (!bankroll) {
      throw new Error(`Player ${playerId} not found`)
    }

    if (amount <= 0) {
      throw new Error('Amount must be positive')
    }

    bankroll.cash += amount
  }

  // ============ Transaction History ============

  /**
   * Gets all transactions
   */
  getAllTransactions(): Transaction[] {
    return [...this.transactions]
  }

  /**
   * Gets transactions for a specific player
   */
  getPlayerTransactions(playerId: string): Transaction[] {
    return this.transactions.filter((t) => t.playerId === playerId)
  }

  /**
   * Gets recent transactions (last N)
   */
  getRecentTransactions(limit: number): Transaction[] {
    return this.transactions.slice(-limit)
  }

  // ============ Statistics ============

  /**
   * Gets total cash in system
   */
  getTotalCash(): number {
    return Array.from(this.bankrolls.values()).reduce((sum, b) => sum + b.cash, 0)
  }

  /**
   * Gets total chips in system
   */
  getTotalChips(): number {
    return Array.from(this.bankrolls.values()).reduce((sum, b) => sum + b.chips, 0)
  }

  /**
   * Gets cashier statistics
   */
  getStatistics() {
    return {
      totalPlayers: this.bankrolls.size,
      totalCash: this.getTotalCash(),
      totalChips: this.getTotalChips(),
      totalTransactions: this.transactions.length,
    }
  }
}
