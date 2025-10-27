import { describe, it, expect, beforeEach } from 'vitest'
import { Pot, PotManager, BettingRound } from './BettingStructure'

describe('Pot', () => {
  let pot: Pot

  beforeEach(() => {
    pot = new Pot()
  })

  describe('constructor', () => {
    it('creates empty pot', () => {
      expect(pot.total).toBe(0)
      expect(pot.getEligiblePlayers()).toEqual([])
    })

    it('can initialize with eligible players', () => {
      const potWithPlayers = new Pot(['p1', 'p2', 'p3'])
      expect(potWithPlayers.getEligiblePlayers()).toEqual(['p1', 'p2', 'p3'])
    })
  })

  describe('addContribution', () => {
    it('adds contribution from player', () => {
      pot.addContribution('player1', 100)
      expect(pot.total).toBe(100)
      expect(pot.getPlayerContribution('player1')).toBe(100)
    })

    it('accumulates multiple contributions from same player', () => {
      pot.addContribution('player1', 100)
      pot.addContribution('player1', 50)
      expect(pot.total).toBe(150)
      expect(pot.getPlayerContribution('player1')).toBe(150)
    })

    it('tracks contributions from multiple players', () => {
      pot.addContribution('player1', 100)
      pot.addContribution('player2', 200)
      pot.addContribution('player3', 150)
      expect(pot.total).toBe(450)
    })

    it('automatically adds player to eligible list', () => {
      pot.addContribution('player1', 100)
      expect(pot.isPlayerEligible('player1')).toBe(true)
    })

    it('throws error for non-positive contribution', () => {
      expect(() => pot.addContribution('player1', 0)).toThrow('Contribution must be positive')
      expect(() => pot.addContribution('player1', -50)).toThrow('Contribution must be positive')
    })
  })

  describe('getAllContributions', () => {
    it('returns all player contributions', () => {
      pot.addContribution('p1', 100)
      pot.addContribution('p2', 200)

      const contributions = pot.getAllContributions()
      expect(contributions).toHaveLength(2)
      expect(contributions).toContainEqual({ playerId: 'p1', amount: 100 })
      expect(contributions).toContainEqual({ playerId: 'p2', amount: 200 })
    })
  })

  describe('eligibility', () => {
    it('tracks eligible players', () => {
      const potWithPlayers = new Pot(['p1', 'p2', 'p3'])
      expect(potWithPlayers.isPlayerEligible('p1')).toBe(true)
      expect(potWithPlayers.isPlayerEligible('p2')).toBe(true)
      expect(potWithPlayers.isPlayerEligible('p3')).toBe(true)
      expect(potWithPlayers.isPlayerEligible('p4')).toBe(false)
    })

    it('removes player eligibility', () => {
      pot.addContribution('p1', 100)
      pot.addContribution('p2', 100)

      expect(pot.isPlayerEligible('p1')).toBe(true)

      pot.removePlayerEligibility('p1')
      expect(pot.isPlayerEligible('p1')).toBe(false)
      expect(pot.isPlayerEligible('p2')).toBe(true)
    })
  })

  describe('clear', () => {
    it('clears all contributions and eligibility', () => {
      pot.addContribution('p1', 100)
      pot.addContribution('p2', 200)

      pot.clear()

      expect(pot.total).toBe(0)
      expect(pot.getEligiblePlayers()).toEqual([])
    })
  })
})

describe('PotManager', () => {
  let potManager: PotManager

  beforeEach(() => {
    potManager = new PotManager()
  })

  describe('simple scenarios (no all-ins)', () => {
    it('collects equal bets into main pot', () => {
      const bets = new Map([
        ['p1', 100],
        ['p2', 100],
        ['p3', 100],
      ])

      potManager.collectBets(bets, new Set(), new Set())

      expect(potManager.getTotalPotAmount()).toBe(300)
      expect(potManager.getSidePotCount()).toBe(0)
      expect(potManager.getMainPot().total).toBe(300)
    })

    it('excludes folded players from eligibility', () => {
      const bets = new Map([
        ['p1', 100],
        ['p2', 100],
        ['p3', 100],
      ])
      const folded = new Set(['p2'])

      potManager.collectBets(bets, new Set(), folded)

      const mainPot = potManager.getMainPot()
      expect(mainPot.isPlayerEligible('p1')).toBe(true)
      expect(mainPot.isPlayerEligible('p2')).toBe(false)
      expect(mainPot.isPlayerEligible('p3')).toBe(true)
    })
  })

  describe('single all-in scenarios', () => {
    it('creates side pot when one player is all-in for less', () => {
      const bets = new Map([
        ['p1', 50], // all-in
        ['p2', 100],
        ['p3', 100],
      ])
      const allIn = new Set(['p1'])

      potManager.collectBets(bets, allIn, new Set())

      // Main pot: 50 from each player (150 total)
      // Side pot: 50 from p2 + 50 from p3 (100 total)
      expect(potManager.getTotalPotAmount()).toBe(250)
      expect(potManager.getSidePotCount()).toBe(1)
      expect(potManager.getMainPot().total).toBe(150)
      expect(potManager.getSidePots()[0]?.total).toBe(100)
    })

    it('side pot excludes all-in player', () => {
      const bets = new Map([
        ['p1', 50], // all-in
        ['p2', 100],
        ['p3', 100],
      ])
      const allIn = new Set(['p1'])

      potManager.collectBets(bets, allIn, new Set())

      const mainPot = potManager.getMainPot()
      const sidePot = potManager.getSidePots()[0]!

      expect(mainPot.isPlayerEligible('p1')).toBe(true)
      expect(mainPot.isPlayerEligible('p2')).toBe(true)
      expect(mainPot.isPlayerEligible('p3')).toBe(true)

      expect(sidePot.isPlayerEligible('p1')).toBe(false)
      expect(sidePot.isPlayerEligible('p2')).toBe(true)
      expect(sidePot.isPlayerEligible('p3')).toBe(true)
    })
  })

  describe('multiple all-in scenarios', () => {
    it('creates multiple side pots for different all-in amounts', () => {
      const bets = new Map([
        ['p1', 50], // all-in
        ['p2', 100], // all-in
        ['p3', 200],
        ['p4', 200],
      ])
      const allIn = new Set(['p1', 'p2'])

      potManager.collectBets(bets, allIn, new Set())

      // Main pot: 50 * 4 = 200 (all players)
      // Side pot 1: 50 * 3 = 150 (p2, p3, p4)
      // Side pot 2: 100 * 2 = 200 (p3, p4)
      expect(potManager.getTotalPotAmount()).toBe(550)
      expect(potManager.getSidePotCount()).toBe(2)
    })

    it('correctly assigns eligibility for multiple side pots', () => {
      const bets = new Map([
        ['p1', 50], // all-in
        ['p2', 100], // all-in
        ['p3', 200],
      ])
      const allIn = new Set(['p1', 'p2'])

      potManager.collectBets(bets, allIn, new Set())

      const mainPot = potManager.getMainPot()
      const sidePots = potManager.getSidePots()

      // Main pot: all players eligible
      expect(mainPot.isPlayerEligible('p1')).toBe(true)
      expect(mainPot.isPlayerEligible('p2')).toBe(true)
      expect(mainPot.isPlayerEligible('p3')).toBe(true)

      // First side pot: p2 and p3
      expect(sidePots[0]?.isPlayerEligible('p1')).toBe(false)
      expect(sidePots[0]?.isPlayerEligible('p2')).toBe(true)
      expect(sidePots[0]?.isPlayerEligible('p3')).toBe(true)

      // Second side pot: only p3
      expect(sidePots[1]?.isPlayerEligible('p1')).toBe(false)
      expect(sidePots[1]?.isPlayerEligible('p2')).toBe(false)
      expect(sidePots[1]?.isPlayerEligible('p3')).toBe(true)
    })
  })

  describe('pot distribution', () => {
    it('distributes main pot to single winner', () => {
      const bets = new Map([
        ['p1', 100],
        ['p2', 100],
        ['p3', 100],
      ])

      potManager.collectBets(bets, new Set(), new Set())

      const winners = [{ playerId: 'p1' }]
      const winnings = potManager.distributePots(winners)

      expect(winnings.get('p1')).toBe(300)
    })

    it('splits pot evenly among multiple winners', () => {
      const bets = new Map([
        ['p1', 100],
        ['p2', 100],
        ['p3', 100],
      ])

      potManager.collectBets(bets, new Set(), new Set())

      const winners = [{ playerId: 'p1' }, { playerId: 'p2' }]
      const winnings = potManager.distributePots(winners)

      expect(winnings.get('p1')).toBe(150)
      expect(winnings.get('p2')).toBe(150)
    })

    it('gives odd chip to first winner in each pot', () => {
      const bets = new Map([
        ['p1', 100],
        ['p2', 100],
        ['p3', 101], // Creates side pot
      ])

      potManager.collectBets(bets, new Set(), new Set())

      // All 3 players tie
      const winners = [{ playerId: 'p1' }, { playerId: 'p2' }, { playerId: 'p3' }]
      const winnings = potManager.distributePots(winners)

      // Main pot (300) splits evenly: 100 each
      // Side pot (1) goes to p3
      expect(winnings.get('p1')).toBe(100)
      expect(winnings.get('p2')).toBe(100)
      expect(winnings.get('p3')).toBe(101) // Gets side pot
    })

    it('distributes side pots only to eligible winners', () => {
      const bets = new Map([
        ['p1', 50], // all-in
        ['p2', 100],
        ['p3', 100],
      ])
      const allIn = new Set(['p1'])

      potManager.collectBets(bets, allIn, new Set())

      // p1 wins (can only win main pot)
      const winners = [{ playerId: 'p1' }]
      const winnings = potManager.distributePots(winners)

      expect(winnings.get('p1')).toBe(150) // Main pot only
      expect(potManager.getSidePots()[0]?.total).toBe(100) // Side pot remains
    })

    it('distributes both main and side pots to winner', () => {
      const bets = new Map([
        ['p1', 50], // all-in
        ['p2', 100],
        ['p3', 100],
      ])
      const allIn = new Set(['p1'])

      potManager.collectBets(bets, allIn, new Set())

      // p2 wins everything
      const winners = [{ playerId: 'p2' }]
      const winnings = potManager.distributePots(winners)

      expect(winnings.get('p2')).toBe(250) // Main pot + side pot
    })

    it('handles complex multi-way all-in with split pots', () => {
      const bets = new Map([
        ['p1', 50], // all-in
        ['p2', 100], // all-in
        ['p3', 200],
        ['p4', 200],
      ])
      const allIn = new Set(['p1', 'p2'])

      potManager.collectBets(bets, allIn, new Set())

      // p3 and p4 tie for best hand
      const winners = [{ playerId: 'p3' }, { playerId: 'p4' }]
      const winnings = potManager.distributePots(winners)

      // Main pot (200) + Side pot 1 (150) + Side pot 2 (200) = 550 total
      // Split between p3 and p4
      expect(winnings.get('p3')).toBe(275)
      expect(winnings.get('p4')).toBe(275)
    })
  })

  describe('reset', () => {
    it('resets all pots', () => {
      const bets = new Map([
        ['p1', 50],
        ['p2', 100],
      ])
      const allIn = new Set(['p1'])

      potManager.collectBets(bets, allIn, new Set())

      expect(potManager.getTotalPotAmount()).toBe(150)

      potManager.reset()

      expect(potManager.getTotalPotAmount()).toBe(0)
      expect(potManager.getSidePotCount()).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('handles zero bets', () => {
      potManager.collectBets(new Map(), new Set(), new Set())
      expect(potManager.getTotalPotAmount()).toBe(0)
    })

    it('handles all players folded except one', () => {
      const bets = new Map([
        ['p1', 100],
        ['p2', 50],
        ['p3', 50],
      ])
      const folded = new Set(['p2', 'p3'])

      potManager.collectBets(bets, new Set(), folded)

      const winners = [{ playerId: 'p1' }]
      const winnings = potManager.distributePots(winners)

      expect(winnings.get('p1')).toBe(200)
    })
  })
})

describe('BettingRound', () => {
  it('defines all betting rounds', () => {
    expect(BettingRound.Preflop).toBe('PREFLOP')
    expect(BettingRound.Flop).toBe('FLOP')
    expect(BettingRound.Turn).toBe('TURN')
    expect(BettingRound.River).toBe('RIVER')
    expect(BettingRound.Showdown).toBe('SHOWDOWN')
  })
})
