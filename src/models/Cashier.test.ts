import { describe, it, expect, beforeEach } from 'vitest'
import { Cashier } from './Cashier'

describe('Cashier', () => {
  let cashier: Cashier

  beforeEach(() => {
    cashier = new Cashier()
  })

  describe('player registration', () => {
    it('registers a new player with starting cash', () => {
      const bankroll = cashier.registerPlayer('p1', 'Alice', 1000)

      expect(bankroll.playerId).toBe('p1')
      expect(bankroll.playerName).toBe('Alice')
      expect(bankroll.cash).toBe(1000)
      expect(bankroll.chips).toBe(0)
    })

    it('throws error if player is already registered', () => {
      cashier.registerPlayer('p1', 'Alice', 1000)

      expect(() => {
        cashier.registerPlayer('p1', 'Alice', 500)
      }).toThrow('Player p1 is already registered')
    })

    it('throws error for negative starting cash', () => {
      expect(() => {
        cashier.registerPlayer('p1', 'Alice', -100)
      }).toThrow('Starting cash cannot be negative')
    })

    it('allows zero starting cash', () => {
      const bankroll = cashier.registerPlayer('p1', 'Alice', 0)
      expect(bankroll.cash).toBe(0)
    })
  })

  describe('bankroll queries', () => {
    beforeEach(() => {
      cashier.registerPlayer('p1', 'Alice', 1000)
      cashier.registerPlayer('p2', 'Bob', 500)
    })

    it('gets player bankroll', () => {
      const bankroll = cashier.getPlayerBankroll('p1')

      expect(bankroll).not.toBeNull()
      expect(bankroll?.playerId).toBe('p1')
      expect(bankroll?.cash).toBe(1000)
    })

    it('returns null for non-existent player', () => {
      const bankroll = cashier.getPlayerBankroll('nonexistent')
      expect(bankroll).toBeNull()
    })

    it('gets all bankrolls', () => {
      const bankrolls = cashier.getAllBankrolls()

      expect(bankrolls).toHaveLength(2)
      expect(bankrolls.map((b) => b.playerId)).toContain('p1')
      expect(bankrolls.map((b) => b.playerId)).toContain('p2')
    })

    it('gets player total worth (cash + chips)', () => {
      cashier.buyIn('p1', 300) // 700 cash, 300 chips

      const worth = cashier.getPlayerTotalWorth('p1')
      expect(worth).toBe(1000) // 700 + 300
    })

    it('returns 0 for non-existent player worth', () => {
      const worth = cashier.getPlayerTotalWorth('nonexistent')
      expect(worth).toBe(0)
    })
  })

  describe('buy-in', () => {
    beforeEach(() => {
      cashier.registerPlayer('p1', 'Alice', 1000)
    })

    it('processes a buy-in', () => {
      const transaction = cashier.buyIn('p1', 200)

      expect(transaction.type).toBe('buy-in')
      expect(transaction.amount).toBe(200)
      expect(transaction.playerId).toBe('p1')
      expect(transaction.id).toBeDefined()
      expect(transaction.timestamp).toBeInstanceOf(Date)

      const bankroll = cashier.getPlayerBankroll('p1')
      expect(bankroll?.cash).toBe(800)
      expect(bankroll?.chips).toBe(200)
    })

    it('processes multiple buy-ins', () => {
      cashier.buyIn('p1', 200)
      cashier.buyIn('p1', 300)

      const bankroll = cashier.getPlayerBankroll('p1')
      expect(bankroll?.cash).toBe(500) // 1000 - 200 - 300
      expect(bankroll?.chips).toBe(500) // 200 + 300
    })

    it('throws error for non-existent player', () => {
      expect(() => {
        cashier.buyIn('nonexistent', 200)
      }).toThrow('Player nonexistent not found')
    })

    it('throws error for zero buy-in', () => {
      expect(() => {
        cashier.buyIn('p1', 0)
      }).toThrow('Buy-in amount must be positive')
    })

    it('throws error for negative buy-in', () => {
      expect(() => {
        cashier.buyIn('p1', -100)
      }).toThrow('Buy-in amount must be positive')
    })

    it('throws error for insufficient cash', () => {
      expect(() => {
        cashier.buyIn('p1', 1500)
      }).toThrow('Insufficient cash')
    })

    it('allows buying in for all cash', () => {
      cashier.buyIn('p1', 1000)

      const bankroll = cashier.getPlayerBankroll('p1')
      expect(bankroll?.cash).toBe(0)
      expect(bankroll?.chips).toBe(1000)
    })
  })

  describe('cash-out', () => {
    beforeEach(() => {
      cashier.registerPlayer('p1', 'Alice', 1000)
      cashier.buyIn('p1', 500) // 500 cash, 500 chips
    })

    it('processes a cash-out', () => {
      const transaction = cashier.cashOut('p1', 200)

      expect(transaction.type).toBe('cash-out')
      expect(transaction.amount).toBe(200)
      expect(transaction.playerId).toBe('p1')

      const bankroll = cashier.getPlayerBankroll('p1')
      expect(bankroll?.cash).toBe(700) // 500 + 200
      expect(bankroll?.chips).toBe(300) // 500 - 200
    })

    it('processes multiple cash-outs', () => {
      cashier.cashOut('p1', 100)
      cashier.cashOut('p1', 200)

      const bankroll = cashier.getPlayerBankroll('p1')
      expect(bankroll?.cash).toBe(800) // 500 + 100 + 200
      expect(bankroll?.chips).toBe(200) // 500 - 100 - 200
    })

    it('throws error for non-existent player', () => {
      expect(() => {
        cashier.cashOut('nonexistent', 200)
      }).toThrow('Player nonexistent not found')
    })

    it('throws error for zero cash-out', () => {
      expect(() => {
        cashier.cashOut('p1', 0)
      }).toThrow('Cash-out amount must be positive')
    })

    it('throws error for negative cash-out', () => {
      expect(() => {
        cashier.cashOut('p1', -100)
      }).toThrow('Cash-out amount must be positive')
    })

    it('throws error for insufficient chips', () => {
      expect(() => {
        cashier.cashOut('p1', 1000)
      }).toThrow('Insufficient chips')
    })

    it('allows cashing out all chips', () => {
      cashier.cashOut('p1', 500)

      const bankroll = cashier.getPlayerBankroll('p1')
      expect(bankroll?.cash).toBe(1000)
      expect(bankroll?.chips).toBe(0)
    })
  })

  describe('add cash', () => {
    beforeEach(() => {
      cashier.registerPlayer('p1', 'Alice', 1000)
    })

    it('adds cash to player bankroll', () => {
      cashier.addCash('p1', 500)

      const bankroll = cashier.getPlayerBankroll('p1')
      expect(bankroll?.cash).toBe(1500)
    })

    it('throws error for non-existent player', () => {
      expect(() => {
        cashier.addCash('nonexistent', 500)
      }).toThrow('Player nonexistent not found')
    })

    it('throws error for zero amount', () => {
      expect(() => {
        cashier.addCash('p1', 0)
      }).toThrow('Amount must be positive')
    })

    it('throws error for negative amount', () => {
      expect(() => {
        cashier.addCash('p1', -100)
      }).toThrow('Amount must be positive')
    })
  })

  describe('transaction history', () => {
    beforeEach(() => {
      cashier.registerPlayer('p1', 'Alice', 1000)
      cashier.registerPlayer('p2', 'Bob', 500)
    })

    it('records buy-in transactions', () => {
      cashier.buyIn('p1', 200)
      cashier.buyIn('p1', 300)

      const transactions = cashier.getPlayerTransactions('p1')
      expect(transactions).toHaveLength(2)
      expect(transactions[0]?.type).toBe('buy-in')
      expect(transactions[0]?.amount).toBe(200)
      expect(transactions[1]?.type).toBe('buy-in')
      expect(transactions[1]?.amount).toBe(300)
    })

    it('records cash-out transactions', () => {
      cashier.buyIn('p1', 500)
      cashier.cashOut('p1', 100)

      const transactions = cashier.getPlayerTransactions('p1')
      expect(transactions).toHaveLength(2)
      expect(transactions[0]?.type).toBe('buy-in')
      expect(transactions[1]?.type).toBe('cash-out')
    })

    it('assigns unique transaction IDs', () => {
      cashier.buyIn('p1', 100)
      cashier.buyIn('p2', 100)

      const allTransactions = cashier.getAllTransactions()
      expect(allTransactions[0]?.id).not.toBe(allTransactions[1]?.id)
    })

    it('gets all transactions', () => {
      cashier.buyIn('p1', 100)
      cashier.buyIn('p2', 50)
      cashier.cashOut('p1', 50)

      const allTransactions = cashier.getAllTransactions()
      expect(allTransactions).toHaveLength(3)
    })

    it('filters transactions by player', () => {
      cashier.buyIn('p1', 100)
      cashier.buyIn('p2', 50)
      cashier.buyIn('p1', 200)

      const p1Transactions = cashier.getPlayerTransactions('p1')
      const p2Transactions = cashier.getPlayerTransactions('p2')

      expect(p1Transactions).toHaveLength(2)
      expect(p2Transactions).toHaveLength(1)
    })

    it('gets recent transactions', () => {
      cashier.buyIn('p1', 100)
      cashier.buyIn('p1', 200)
      cashier.buyIn('p1', 300)
      cashier.buyIn('p1', 400)

      const recent = cashier.getRecentTransactions(2)
      expect(recent).toHaveLength(2)
      expect(recent[0]?.amount).toBe(300)
      expect(recent[1]?.amount).toBe(400)
    })

    it('returns empty array for player with no transactions', () => {
      const transactions = cashier.getPlayerTransactions('p1')
      expect(transactions).toEqual([])
    })
  })

  describe('statistics', () => {
    beforeEach(() => {
      cashier.registerPlayer('p1', 'Alice', 1000)
      cashier.registerPlayer('p2', 'Bob', 500)
      cashier.registerPlayer('p3', 'Charlie', 2000)
    })

    it('calculates total cash', () => {
      expect(cashier.getTotalCash()).toBe(3500)
    })

    it('calculates total chips', () => {
      expect(cashier.getTotalChips()).toBe(0)

      cashier.buyIn('p1', 300)
      cashier.buyIn('p2', 100)

      expect(cashier.getTotalChips()).toBe(400)
    })

    it('total worth remains constant after buy-ins', () => {
      const initialTotal = cashier.getTotalCash() + cashier.getTotalChips()

      cashier.buyIn('p1', 300)
      cashier.buyIn('p2', 100)

      const finalTotal = cashier.getTotalCash() + cashier.getTotalChips()
      expect(finalTotal).toBe(initialTotal)
    })

    it('gets cashier statistics', () => {
      cashier.buyIn('p1', 200)
      cashier.buyIn('p2', 100)

      const stats = cashier.getStatistics()

      expect(stats.totalPlayers).toBe(3)
      expect(stats.totalCash).toBe(3200) // 3500 - 300
      expect(stats.totalChips).toBe(300)
      expect(stats.totalTransactions).toBe(2)
    })
  })

  describe('integrated workflow', () => {
    it('handles complete player lifecycle', () => {
      // Register player
      cashier.registerPlayer('p1', 'Alice', 1000)

      // Buy in for first session
      cashier.buyIn('p1', 300)
      expect(cashier.getPlayerBankroll('p1')?.cash).toBe(700)
      expect(cashier.getPlayerBankroll('p1')?.chips).toBe(300)

      // Win some chips (represented by having more chips than bought in)
      // In real game, chips would increase at table
      // Cash out with profit
      const bankroll = cashier.getPlayerBankroll('p1')!
      bankroll.chips = 500 // Simulate winning 200

      cashier.cashOut('p1', 500)
      expect(cashier.getPlayerBankroll('p1')?.cash).toBe(1200) // Started with 1000, now 1200
      expect(cashier.getPlayerBankroll('p1')?.chips).toBe(0)

      // Player total worth increased
      expect(cashier.getPlayerTotalWorth('p1')).toBe(1200)

      // Transaction history shows all activity
      const transactions = cashier.getPlayerTransactions('p1')
      expect(transactions).toHaveLength(2)
      expect(transactions[0]?.type).toBe('buy-in')
      expect(transactions[1]?.type).toBe('cash-out')
    })

    it('handles player going broke and reloading', () => {
      cashier.registerPlayer('p1', 'Alice', 500)

      // Buy in with all cash
      cashier.buyIn('p1', 500)
      expect(cashier.getPlayerBankroll('p1')?.cash).toBe(0)
      expect(cashier.getPlayerBankroll('p1')?.chips).toBe(500)

      // Lose all chips (simulated)
      const bankroll = cashier.getPlayerBankroll('p1')!
      bankroll.chips = 0

      // Can't buy in anymore
      expect(() => cashier.buyIn('p1', 100)).toThrow('Insufficient cash')

      // Add more cash (reload)
      cashier.addCash('p1', 1000)
      expect(cashier.getPlayerBankroll('p1')?.cash).toBe(1000)

      // Can buy in again
      cashier.buyIn('p1', 300)
      expect(cashier.getPlayerBankroll('p1')?.cash).toBe(700)
      expect(cashier.getPlayerBankroll('p1')?.chips).toBe(300)
    })
  })
})
