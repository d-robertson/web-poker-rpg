import { describe, it, expect, beforeEach } from 'vitest'
import { Casino } from './Casino'
import { Player } from './Player'

describe('Casino', () => {
  let casino: Casino

  beforeEach(() => {
    casino = new Casino({ name: 'Test Casino' })
  })

  describe('initialization', () => {
    it('creates casino with name', () => {
      expect(casino.casinoName).toBe('Test Casino')
      expect(casino.tableCount).toBe(0)
    })
  })

  describe('table management', () => {
    it('creates a new table', () => {
      const tableInfo = casino.createTable({
        name: 'Table 1',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      expect(tableInfo.name).toBe('Table 1')
      expect(tableInfo.maxPlayers).toBe(6)
      expect(tableInfo.currentPlayers).toBe(0)
      expect(tableInfo.smallBlind).toBe(5)
      expect(tableInfo.bigBlind).toBe(10)
      expect(tableInfo.minBuyIn).toBe(100)
      expect(tableInfo.maxBuyIn).toBe(1000)
      expect(tableInfo.table).toBeDefined()
      expect(casino.tableCount).toBe(1)
    })

    it('assigns unique IDs to tables', () => {
      const table1 = casino.createTable({
        name: 'Table 1',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      const table2 = casino.createTable({
        name: 'Table 2',
        maxSeats: 9,
        smallBlind: 10,
        bigBlind: 20,
        minBuyIn: 200,
        maxBuyIn: 2000,
      })

      expect(table1.id).not.toBe(table2.id)
      expect(casino.tableCount).toBe(2)
    })

    it('gets table by ID', () => {
      const created = casino.createTable({
        name: 'Table 1',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      const retrieved = casino.getTable(created.id)
      expect(retrieved).toBe(created)
    })

    it('returns null for non-existent table', () => {
      const table = casino.getTable('non-existent')
      expect(table).toBeNull()
    })

    it('gets all tables', () => {
      casino.createTable({
        name: 'Table 1',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      casino.createTable({
        name: 'Table 2',
        maxSeats: 9,
        smallBlind: 10,
        bigBlind: 20,
        minBuyIn: 200,
        maxBuyIn: 2000,
      })

      const tables = casino.getAllTables()
      expect(tables).toHaveLength(2)
    })

    it('removes a table', () => {
      const table = casino.createTable({
        name: 'Table 1',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      expect(casino.tableCount).toBe(1)
      const removed = casino.removeTable(table.id)
      expect(removed).toBe(true)
      expect(casino.tableCount).toBe(0)
    })

    it('returns false when removing non-existent table', () => {
      const removed = casino.removeTable('non-existent')
      expect(removed).toBe(false)
    })
  })

  describe('available tables', () => {
    it('returns tables that are not full', () => {
      const table1 = casino.createTable({
        name: 'Table 1',
        maxSeats: 2,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      const table2 = casino.createTable({
        name: 'Table 2',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      // Fill table1
      const player1 = new Player('p1', 'Alice', 500)
      const player2 = new Player('p2', 'Bob', 500)
      casino.seatPlayerAtTable(table1.id, player1, 0, 200)
      casino.seatPlayerAtTable(table1.id, player2, 1, 200)

      const available = casino.getAvailableTables()
      expect(available).toHaveLength(1)
      expect(available[0]?.id).toBe(table2.id)
    })

    it('returns all tables when none are full', () => {
      casino.createTable({
        name: 'Table 1',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      casino.createTable({
        name: 'Table 2',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      const available = casino.getAvailableTables()
      expect(available).toHaveLength(2)
    })
  })

  describe('player management', () => {
    let table1: ReturnType<typeof casino.createTable>
    let player: Player

    beforeEach(() => {
      table1 = casino.createTable({
        name: 'Table 1',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })
      player = new Player('p1', 'Alice', 500)
    })

    it('seats a player at a table with valid buy-in', () => {
      const success = casino.seatPlayerAtTable(table1.id, player, 0, 200)

      expect(success).toBe(true)
      expect(table1.currentPlayers).toBe(1)

      const updatedTable = casino.getTable(table1.id)
      expect(updatedTable?.currentPlayers).toBe(1)
    })

    it('throws error for buy-in below minimum', () => {
      expect(() => {
        casino.seatPlayerAtTable(table1.id, player, 0, 50)
      }).toThrow('Buy-in must be between')
    })

    it('throws error for buy-in above maximum', () => {
      expect(() => {
        casino.seatPlayerAtTable(table1.id, player, 0, 1500)
      }).toThrow('Buy-in must be between')
    })

    it('throws error if player does not have enough chips', () => {
      const poorPlayer = new Player('p2', 'Bob', 50)

      expect(() => {
        casino.seatPlayerAtTable(table1.id, poorPlayer, 0, 100)
      }).toThrow('Player does not have enough chips')
    })

    it('throws error for non-existent table', () => {
      expect(() => {
        casino.seatPlayerAtTable('non-existent', player, 0, 200)
      }).toThrow('Table non-existent not found')
    })

    it('throws error when seating in occupied position', () => {
      const player2 = new Player('p2', 'Bob', 500)

      casino.seatPlayerAtTable(table1.id, player, 0, 200)

      expect(() => {
        casino.seatPlayerAtTable(table1.id, player2, 0, 200)
      }).toThrow('Seat 0 is already occupied')
    })

    it('removes player from table', () => {
      casino.seatPlayerAtTable(table1.id, player, 0, 200)
      expect(table1.currentPlayers).toBe(1)

      const removed = casino.removePlayerFromTable(table1.id, player.id)
      expect(removed).toBe(true)

      const updatedTable = casino.getTable(table1.id)
      expect(updatedTable?.currentPlayers).toBe(0)
    })

    it('returns false when removing player from non-existent table', () => {
      const removed = casino.removePlayerFromTable('non-existent', player.id)
      expect(removed).toBe(false)
    })

    it('finds which table a player is seated at', () => {
      casino.seatPlayerAtTable(table1.id, player, 0, 200)

      const foundTable = casino.findPlayerTable(player.id)
      expect(foundTable).toBe(table1)
    })

    it('returns null when player is not at any table', () => {
      const foundTable = casino.findPlayerTable(player.id)
      expect(foundTable).toBeNull()
    })

    it('finds player across multiple tables', () => {
      const table2 = casino.createTable({
        name: 'Table 2',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      const player2 = new Player('p2', 'Bob', 500)
      casino.seatPlayerAtTable(table1.id, player, 0, 200)
      casino.seatPlayerAtTable(table2.id, player2, 0, 200)

      const foundTable1 = casino.findPlayerTable(player.id)
      const foundTable2 = casino.findPlayerTable(player2.id)

      expect(foundTable1?.id).toBe(table1.id)
      expect(foundTable2?.id).toBe(table2.id)
    })
  })

  describe('statistics', () => {
    it('gets total players across all tables', () => {
      const table1 = casino.createTable({
        name: 'Table 1',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      const table2 = casino.createTable({
        name: 'Table 2',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      const player1 = new Player('p1', 'Alice', 500)
      const player2 = new Player('p2', 'Bob', 500)
      const player3 = new Player('p3', 'Charlie', 500)

      casino.seatPlayerAtTable(table1.id, player1, 0, 200)
      casino.seatPlayerAtTable(table1.id, player2, 1, 200)
      casino.seatPlayerAtTable(table2.id, player3, 0, 200)

      expect(casino.getTotalPlayers()).toBe(3)
    })

    it('gets casino statistics', () => {
      casino.createTable({
        name: 'Table 1',
        maxSeats: 6,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      const table2 = casino.createTable({
        name: 'Table 2',
        maxSeats: 2,
        smallBlind: 5,
        bigBlind: 10,
        minBuyIn: 100,
        maxBuyIn: 1000,
      })

      const player1 = new Player('p1', 'Alice', 500)
      const player2 = new Player('p2', 'Bob', 500)

      // Fill table2
      casino.seatPlayerAtTable(table2.id, player1, 0, 200)
      casino.seatPlayerAtTable(table2.id, player2, 1, 200)

      const stats = casino.getStatistics()

      expect(stats.name).toBe('Test Casino')
      expect(stats.totalTables).toBe(2)
      expect(stats.totalPlayers).toBe(2)
      expect(stats.availableTables).toBe(1) // Only table1 is available
    })
  })
})
