import { Table, TableConfig } from './Table'
import { Player } from './Player'

export interface CasinoTableInfo {
  id: string
  name: string
  table: Table
  maxPlayers: number
  currentPlayers: number
  smallBlind: number
  bigBlind: number
  minBuyIn: number
  maxBuyIn: number
}

export interface CasinoConfig {
  name: string
}

/**
 * Casino manages multiple poker tables
 */
export class Casino {
  private name: string
  private tables: Map<string, CasinoTableInfo>
  private nextTableId: number

  constructor(config: CasinoConfig) {
    this.name = config.name
    this.tables = new Map()
    this.nextTableId = 1
  }

  // ============ Table Management ============

  /**
   * Creates a new table in the casino
   */
  createTable(config: {
    name: string
    maxSeats: number
    smallBlind: number
    bigBlind: number
    minBuyIn: number
    maxBuyIn: number
  }): CasinoTableInfo {
    const tableId = `table-${this.nextTableId++}`

    const tableConfig: TableConfig = {
      maxSeats: config.maxSeats,
      smallBlind: config.smallBlind,
      bigBlind: config.bigBlind,
    }

    const table = new Table(tableConfig)

    const tableInfo: CasinoTableInfo = {
      id: tableId,
      name: config.name,
      table,
      maxPlayers: config.maxSeats,
      currentPlayers: 0,
      smallBlind: config.smallBlind,
      bigBlind: config.bigBlind,
      minBuyIn: config.minBuyIn,
      maxBuyIn: config.maxBuyIn,
    }

    this.tables.set(tableId, tableInfo)
    return tableInfo
  }

  /**
   * Gets a table by ID
   */
  getTable(tableId: string): CasinoTableInfo | null {
    return this.tables.get(tableId) ?? null
  }

  /**
   * Gets all tables in the casino
   */
  getAllTables(): CasinoTableInfo[] {
    return Array.from(this.tables.values())
  }

  /**
   * Gets available tables (not full)
   */
  getAvailableTables(): CasinoTableInfo[] {
    return Array.from(this.tables.values()).filter(
      (info) => info.currentPlayers < info.maxPlayers
    )
  }

  /**
   * Removes a table from the casino
   */
  removeTable(tableId: string): boolean {
    return this.tables.delete(tableId)
  }

  /**
   * Gets the number of tables
   */
  get tableCount(): number {
    return this.tables.size
  }

  /**
   * Gets the casino name
   */
  get casinoName(): string {
    return this.name
  }

  // ============ Player Management ============

  /**
   * Seats a player at a specific table
   */
  seatPlayerAtTable(
    tableId: string,
    player: Player,
    seatPosition: number,
    buyInAmount: number
  ): boolean {
    const tableInfo = this.tables.get(tableId)
    if (!tableInfo) {
      throw new Error(`Table ${tableId} not found`)
    }

    // Validate buy-in amount
    if (buyInAmount < tableInfo.minBuyIn || buyInAmount > tableInfo.maxBuyIn) {
      throw new Error(
        `Buy-in must be between ${tableInfo.minBuyIn} and ${tableInfo.maxBuyIn}`
      )
    }

    // Check if player has enough chips
    if (player.chips < buyInAmount) {
      throw new Error('Player does not have enough chips for buy-in')
    }

    // Try to seat the player
    try {
      tableInfo.table.seatPlayer(player, seatPosition)
      tableInfo.currentPlayers = tableInfo.table.playerCount
      return true
    } catch (error) {
      throw error
    }
  }

  /**
   * Removes a player from a table
   */
  removePlayerFromTable(tableId: string, playerId: string): boolean {
    const tableInfo = this.tables.get(tableId)
    if (!tableInfo) {
      return false
    }

    const removed = tableInfo.table.removePlayer(playerId)
    if (removed) {
      tableInfo.currentPlayers = tableInfo.table.playerCount
    }
    return removed
  }

  /**
   * Finds which table a player is seated at
   */
  findPlayerTable(playerId: string): CasinoTableInfo | null {
    for (const tableInfo of this.tables.values()) {
      if (tableInfo.table.getPlayer(playerId)) {
        return tableInfo
      }
    }
    return null
  }

  // ============ Statistics ============

  /**
   * Gets total number of players across all tables
   */
  getTotalPlayers(): number {
    return Array.from(this.tables.values()).reduce(
      (sum, info) => sum + info.currentPlayers,
      0
    )
  }

  /**
   * Gets casino statistics
   */
  getStatistics() {
    return {
      name: this.name,
      totalTables: this.tables.size,
      totalPlayers: this.getTotalPlayers(),
      availableTables: this.getAvailableTables().length,
    }
  }
}
