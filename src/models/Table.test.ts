import { describe, it, expect, beforeEach } from 'vitest'
import { Table } from './Table'
import { Player } from './Player'
import { createCard } from './Card'

describe('Table', () => {
  let table: Table
  let player1: Player
  let player2: Player
  let player3: Player

  beforeEach(() => {
    table = new Table({
      maxSeats: 6,
      smallBlind: 5,
      bigBlind: 10,
    })

    player1 = new Player('p1', 'Alice', 1000)
    player2 = new Player('p2', 'Bob', 1000)
    player3 = new Player('p3', 'Charlie', 1000)
  })

  describe('constructor', () => {
    it('creates table with specified number of seats', () => {
      expect(table.getSeats()).toHaveLength(6)
    })

    it('initializes all seats as empty', () => {
      const seats = table.getSeats()
      seats.forEach((seat) => {
        expect(seat.isEmpty).toBe(true)
        expect(seat.player).toBeNull()
      })
    })

    it('sets button position to 0', () => {
      expect(table.getButtonPosition()).toBe(0)
    })

    it('initializes with no community cards', () => {
      expect(table.getCommunityCards()).toEqual([])
    })
  })

  describe('seat management', () => {
    describe('seatPlayer', () => {
      it('seats a player at specified position', () => {
        table.seatPlayer(player1, 0)
        expect(table.getPlayerAtSeat(0)).toBe(player1)
      })

      it('marks seat as occupied', () => {
        table.seatPlayer(player1, 2)
        const seats = table.getSeats()
        expect(seats[2]?.isEmpty).toBe(false)
      })

      it('throws error for invalid seat position', () => {
        expect(() => table.seatPlayer(player1, -1)).toThrow('Invalid seat position')
        expect(() => table.seatPlayer(player1, 10)).toThrow('Invalid seat position')
      })

      it('throws error if seat is already occupied', () => {
        table.seatPlayer(player1, 0)
        expect(() => table.seatPlayer(player2, 0)).toThrow('Seat 0 is already occupied')
      })

      it('can seat multiple players at different positions', () => {
        table.seatPlayer(player1, 0)
        table.seatPlayer(player2, 2)
        table.seatPlayer(player3, 4)

        expect(table.playerCount).toBe(3)
        expect(table.getPlayerAtSeat(0)).toBe(player1)
        expect(table.getPlayerAtSeat(2)).toBe(player2)
        expect(table.getPlayerAtSeat(4)).toBe(player3)
      })
    })

    describe('removePlayer', () => {
      it('removes player from table', () => {
        table.seatPlayer(player1, 0)
        table.removePlayer('p1')

        expect(table.getPlayerAtSeat(0)).toBeNull()
        expect(table.playerCount).toBe(0)
      })

      it('marks seat as empty after removal', () => {
        table.seatPlayer(player1, 2)
        table.removePlayer('p1')

        const seats = table.getSeats()
        expect(seats[2]?.isEmpty).toBe(true)
      })

      it('returns false if player not found', () => {
        const removed = table.removePlayer('nonexistent')
        expect(removed).toBe(false)
      })
    })

    describe('getPlayer', () => {
      it('returns player by ID', () => {
        table.seatPlayer(player1, 0)
        expect(table.getPlayer('p1')).toBe(player1)
      })

      it('returns null if player not found', () => {
        expect(table.getPlayer('nonexistent')).toBeNull()
      })
    })

    describe('getPlayers', () => {
      it('returns all players at table', () => {
        table.seatPlayer(player1, 0)
        table.seatPlayer(player2, 2)
        table.seatPlayer(player3, 4)

        const players = table.getPlayers()
        expect(players).toHaveLength(3)
        expect(players).toContain(player1)
        expect(players).toContain(player2)
        expect(players).toContain(player3)
      })

      it('returns empty array if no players', () => {
        expect(table.getPlayers()).toEqual([])
      })
    })

    describe('getActivePlayers', () => {
      it('returns only active players', () => {
        table.seatPlayer(player1, 0)
        table.seatPlayer(player2, 1)
        table.seatPlayer(player3, 2)

        player2.fold()

        const activePlayers = table.getActivePlayers()
        expect(activePlayers).toHaveLength(2)
        expect(activePlayers).toContain(player1)
        expect(activePlayers).toContain(player3)
        expect(activePlayers).not.toContain(player2)
      })
    })

    describe('getNextEmptySeat', () => {
      it('returns first empty seat', () => {
        table.seatPlayer(player1, 0)
        expect(table.getNextEmptySeat()).toBe(1)
      })

      it('returns null if table is full', () => {
        for (let i = 0; i < 6; i++) {
          table.seatPlayer(new Player(`p${i}`, `Player${i}`, 1000), i)
        }
        expect(table.getNextEmptySeat()).toBeNull()
      })
    })
  })

  describe('button and blind positions', () => {
    beforeEach(() => {
      // Seat players at positions 0, 2, 4
      table.seatPlayer(player1, 0)
      table.seatPlayer(player2, 2)
      table.seatPlayer(player3, 4)
    })

    describe('button management', () => {
      it('sets button position', () => {
        table.setButtonPosition(2)
        expect(table.getButtonPosition()).toBe(2)
      })

      it('throws error for invalid button position', () => {
        expect(() => table.setButtonPosition(-1)).toThrow('Invalid button position')
        expect(() => table.setButtonPosition(10)).toThrow('Invalid button position')
      })

      it('moves button to next occupied seat', () => {
        table.setButtonPosition(0)
        table.moveButton()
        expect(table.getButtonPosition()).toBe(2) // Skips empty seat 1
      })

      it('wraps around when moving button', () => {
        table.setButtonPosition(4)
        table.moveButton()
        expect(table.getButtonPosition()).toBe(0) // Wraps to beginning
      })

      it('throws error if no occupied seats to move to', () => {
        const emptyTable = new Table({ maxSeats: 6, smallBlind: 5, bigBlind: 10 })
        expect(() => emptyTable.moveButton()).toThrow('No occupied seats to move button to')
      })
    })

    describe('small blind position', () => {
      it('returns null with less than 2 players', () => {
        const newTable = new Table({ maxSeats: 6, smallBlind: 5, bigBlind: 10 })
        newTable.seatPlayer(player1, 0)
        expect(newTable.getSmallBlindPosition()).toBeNull()
      })

      it('heads-up: button is small blind', () => {
        const headsUp = new Table({ maxSeats: 6, smallBlind: 5, bigBlind: 10 })
        headsUp.seatPlayer(player1, 0)
        headsUp.seatPlayer(player2, 2)
        headsUp.setButtonPosition(0)

        expect(headsUp.getSmallBlindPosition()).toBe(0)
      })

      it('multi-way: small blind is next seat after button', () => {
        table.setButtonPosition(0)
        expect(table.getSmallBlindPosition()).toBe(2) // Next occupied seat
      })

      it('skips empty seats', () => {
        table.setButtonPosition(4)
        expect(table.getSmallBlindPosition()).toBe(0) // Skips empty seat 5
      })
    })

    describe('big blind position', () => {
      it('returns null with less than 2 players', () => {
        const newTable = new Table({ maxSeats: 6, smallBlind: 5, bigBlind: 10 })
        newTable.seatPlayer(player1, 0)
        expect(newTable.getBigBlindPosition()).toBeNull()
      })

      it('heads-up: non-button is big blind', () => {
        const headsUp = new Table({ maxSeats: 6, smallBlind: 5, bigBlind: 10 })
        headsUp.seatPlayer(player1, 0)
        headsUp.seatPlayer(player2, 2)
        headsUp.setButtonPosition(0)

        expect(headsUp.getBigBlindPosition()).toBe(2)
      })

      it('multi-way: big blind is two seats after button', () => {
        table.setButtonPosition(0)
        expect(table.getBigBlindPosition()).toBe(4) // Two occupied seats after button
      })
    })

    describe('blind players', () => {
      it('gets small blind player', () => {
        table.setButtonPosition(0)
        expect(table.getSmallBlindPlayer()).toBe(player2)
      })

      it('gets big blind player', () => {
        table.setButtonPosition(0)
        expect(table.getBigBlindPlayer()).toBe(player3)
      })

      it('returns null if not enough players', () => {
        const newTable = new Table({ maxSeats: 6, smallBlind: 5, bigBlind: 10 })
        newTable.seatPlayer(player1, 0)

        expect(newTable.getSmallBlindPlayer()).toBeNull()
        expect(newTable.getBigBlindPlayer()).toBeNull()
      })
    })
  })

  describe('community cards', () => {
    it('sets community cards', () => {
      const cards = [createCard('A♠'), createCard('K♥'), createCard('Q♦')]
      table.setCommunityCards(cards)

      const community = table.getCommunityCards()
      expect(community).toHaveLength(3)
    })

    it('gets community cards', () => {
      const cards = [createCard('J♣'), createCard('T♠')]
      table.setCommunityCards(cards)

      expect(table.getCommunityCards()).toHaveLength(2)
    })

    it('clears community cards', () => {
      const cards = [createCard('9♥'), createCard('8♦'), createCard('7♣')]
      table.setCommunityCards(cards)
      table.clearCommunityCards()

      expect(table.getCommunityCards()).toEqual([])
    })
  })

  describe('resetForNewHand', () => {
    it('clears community cards', () => {
      table.setCommunityCards([createCard('A♠'), createCard('K♥')])
      table.resetForNewHand()

      expect(table.getCommunityCards()).toEqual([])
    })

    it('resets all players', () => {
      table.seatPlayer(player1, 0)
      table.seatPlayer(player2, 1)

      player1.bet(100)
      player2.fold()

      table.resetForNewHand()

      expect(player1.currentBetAmount).toBe(0)
      expect(player2.isActive).toBe(true) // Folded player becomes active again
    })
  })

  describe('player ordering', () => {
    beforeEach(() => {
      // Seat players at positions 0, 2, 4
      table.seatPlayer(player1, 0)
      table.seatPlayer(player2, 2)
      table.seatPlayer(player3, 4)
    })

    describe('getPlayersInOrder', () => {
      it('returns players starting from specified position', () => {
        const players = table.getPlayersInOrder(0)
        expect(players).toEqual([player1, player2, player3])
      })

      it('wraps around the table', () => {
        const players = table.getPlayersInOrder(2)
        expect(players).toEqual([player2, player3, player1])
      })

      it('returns players in correct order from middle position', () => {
        const players = table.getPlayersInOrder(4)
        expect(players).toEqual([player3, player1, player2])
      })
    })

    describe('getActivePlayersInOrder', () => {
      it('returns only active players in order', () => {
        player2.fold()

        const players = table.getActivePlayersInOrder(0)
        expect(players).toEqual([player1, player3])
      })

      it('returns empty array if all players folded', () => {
        player1.fold()
        player2.fold()
        player3.fold()

        expect(table.getActivePlayersInOrder(0)).toEqual([])
      })
    })
  })

  describe('full table scenario', () => {
    it('handles 6-player table correctly', () => {
      const players = [
        new Player('p1', 'Alice', 1000),
        new Player('p2', 'Bob', 1000),
        new Player('p3', 'Charlie', 1000),
        new Player('p4', 'Diana', 1000),
        new Player('p5', 'Eve', 1000),
        new Player('p6', 'Frank', 1000),
      ]

      players.forEach((p, i) => table.seatPlayer(p, i))

      expect(table.playerCount).toBe(6)
      expect(table.getNextEmptySeat()).toBeNull()

      table.setButtonPosition(0)
      expect(table.getSmallBlindPosition()).toBe(1)
      expect(table.getBigBlindPosition()).toBe(2)
    })
  })
})
