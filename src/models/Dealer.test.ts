import { describe, it, expect, beforeEach } from 'vitest'
import { Dealer } from './Dealer'
import { Table } from './Table'
import { Player } from './Player'
import { PotManager } from '../engine/BettingStructure'
import { createCard } from './Card'

describe('Dealer', () => {
  let table: Table
  let dealer: Dealer
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

    table.seatPlayer(player1, 0)
    table.seatPlayer(player2, 2)
    table.seatPlayer(player3, 4)

    dealer = new Dealer(table)
  })

  describe('constructor', () => {
    it('creates dealer with table', () => {
      expect(dealer.getTable()).toBe(table)
    })

    it('initializes with a fresh deck', () => {
      const deck = dealer.getDeck()
      expect(deck.remainingCards).toBe(52)
    })
  })

  describe('prepareNewHand', () => {
    it('resets and shuffles deck', () => {
      dealer.getDeck().dealCards(10) // Deal some cards
      dealer.prepareNewHand()

      expect(dealer.getDeck().remainingCards).toBe(52)
    })

    it('resets table for new hand', () => {
      table.setCommunityCards([createCard('A♠'), createCard('K♥')])
      dealer.prepareNewHand()

      expect(table.getCommunityCards()).toEqual([])
    })

    it('resets players', () => {
      player1.bet(100)
      dealer.prepareNewHand()

      expect(player1.currentBetAmount).toBe(0)
    })
  })

  describe('dealing hole cards', () => {
    beforeEach(() => {
      dealer.prepareNewHand()
    })

    it('deals 2 cards to each active player', () => {
      dealer.dealHoleCards()

      expect(player1.getHoleCards()).toHaveLength(2)
      expect(player2.getHoleCards()).toHaveLength(2)
      expect(player3.getHoleCards()).toHaveLength(2)
    })

    it('removes cards from deck', () => {
      const initialCards = dealer.getDeck().remainingCards
      dealer.dealHoleCards()

      expect(dealer.getDeck().remainingCards).toBe(initialCards - 6) // 3 players * 2 cards
    })

    it('throws error with less than 2 players', () => {
      const singleTable = new Table({ maxSeats: 6, smallBlind: 5, bigBlind: 10 })
      singleTable.seatPlayer(player1, 0)
      const singleDealer = new Dealer(singleTable)
      singleDealer.prepareNewHand()

      expect(() => singleDealer.dealHoleCards()).toThrow('Need at least 2 players to deal')
    })

    it('deals to only active players', () => {
      player2.sitOut()
      dealer.dealHoleCards()

      expect(player1.hasCards).toBe(true)
      expect(player2.hasCards).toBe(false) // Sitting out
      expect(player3.hasCards).toBe(true)
    })

    it('each player receives different cards', () => {
      dealer.dealHoleCards()

      const p1Cards = player1.getHoleCards()
      const p2Cards = player2.getHoleCards()
      const p3Cards = player3.getHoleCards()

      // Check no duplicate cards (simplified check)
      const allCards = [...p1Cards, ...p2Cards, ...p3Cards]
      const uniqueCards = new Set(allCards.map((c) => c.shorthand))
      expect(uniqueCards.size).toBe(6) // All cards should be unique
    })
  })

  describe('dealing community cards', () => {
    beforeEach(() => {
      dealer.prepareNewHand()
      dealer.dealHoleCards()
    })

    describe('dealFlop', () => {
      it('burns a card and deals 3 cards', () => {
        const cardsBeforeFlop = dealer.getDeck().remainingCards
        const flop = dealer.dealFlop()

        expect(flop).toHaveLength(3)
        expect(dealer.getDeck().remainingCards).toBe(cardsBeforeFlop - 4) // 1 burn + 3 flop
      })

      it('sets community cards on table', () => {
        dealer.dealFlop()
        expect(table.getCommunityCards()).toHaveLength(3)
      })

      it('returns the flop cards', () => {
        const flop = dealer.dealFlop()
        const community = table.getCommunityCards()

        expect(flop).toEqual(community)
      })
    })

    describe('dealTurn', () => {
      beforeEach(() => {
        dealer.dealFlop()
      })

      it('burns a card and deals 1 card', () => {
        const cardsBeforeTurn = dealer.getDeck().remainingCards
        const turn = dealer.dealTurn()

        expect(turn).toBeDefined()
        expect(dealer.getDeck().remainingCards).toBe(cardsBeforeTurn - 2) // 1 burn + 1 turn
      })

      it('adds turn to community cards', () => {
        dealer.dealTurn()
        expect(table.getCommunityCards()).toHaveLength(4)
      })

      it('returns the turn card', () => {
        const turn = dealer.dealTurn()
        const community = table.getCommunityCards()

        expect(community[3]).toEqual(turn)
      })
    })

    describe('dealRiver', () => {
      beforeEach(() => {
        dealer.dealFlop()
        dealer.dealTurn()
      })

      it('burns a card and deals 1 card', () => {
        const cardsBeforeRiver = dealer.getDeck().remainingCards
        const river = dealer.dealRiver()

        expect(river).toBeDefined()
        expect(dealer.getDeck().remainingCards).toBe(cardsBeforeRiver - 2) // 1 burn + 1 river
      })

      it('adds river to community cards', () => {
        dealer.dealRiver()
        expect(table.getCommunityCards()).toHaveLength(5)
      })

      it('returns the river card', () => {
        const river = dealer.dealRiver()
        const community = table.getCommunityCards()

        expect(community[4]).toEqual(river)
      })
    })

    it('completes full dealing sequence', () => {
      // Flop
      dealer.dealFlop()
      expect(table.getCommunityCards()).toHaveLength(3)

      // Turn
      dealer.dealTurn()
      expect(table.getCommunityCards()).toHaveLength(4)

      // River
      dealer.dealRiver()
      expect(table.getCommunityCards()).toHaveLength(5)

      // Total cards dealt: 6 (hole) + 3 (burns) + 5 (community) = 14
      // Remaining: 52 - 14 = 38
      expect(dealer.getDeck().remainingCards).toBe(38)
    })
  })

  describe('button management', () => {
    it('moves button', () => {
      table.setButtonPosition(0)
      dealer.moveButton()
      expect(dealer.getButtonPosition()).toBe(2) // Next occupied seat
    })

    it('gets button position', () => {
      table.setButtonPosition(4)
      expect(dealer.getButtonPosition()).toBe(4)
    })
  })

  describe('winner determination', () => {
    beforeEach(() => {
      dealer.prepareNewHand()
    })

    it('determines winner with best hand', () => {
      // Give player1 a royal flush
      player1.receiveCards([createCard('A♠'), createCard('K♠')])

      // Give player2 a pair
      player2.receiveCards([createCard('2♥'), createCard('2♦')])

      // Set community cards for royal flush
      table.setCommunityCards([
        createCard('Q♠'),
        createCard('J♠'),
        createCard('T♠'),
        createCard('9♣'),
        createCard('8♦'),
      ])

      const winners = dealer.determineWinners()

      expect(winners).toHaveLength(1)
      expect(winners[0]?.player).toBe(player1)
    })

    it('handles tie with multiple winners', () => {
      // All players have same hand using all community cards
      player1.receiveCards([createCard('2♥'), createCard('3♦')])
      player2.receiveCards([createCard('4♣'), createCard('5♠')])
      player3.receiveCards([createCard('6♣'), createCard('7♠')])

      // Royal flush on board - all players have same best hand
      table.setCommunityCards([
        createCard('A♠'),
        createCard('K♠'),
        createCard('Q♠'),
        createCard('J♠'),
        createCard('T♠'),
      ])

      const winners = dealer.determineWinners()

      expect(winners).toHaveLength(3) // All 3 players tie
      expect(winners.map((w) => w.player)).toContain(player1)
      expect(winners.map((w) => w.player)).toContain(player2)
      expect(winners.map((w) => w.player)).toContain(player3)
    })

    it('excludes folded players', () => {
      player1.receiveCards([createCard('A♠'), createCard('A♥')])
      player2.receiveCards([createCard('K♠'), createCard('K♥')])
      player3.receiveCards([createCard('Q♠'), createCard('Q♥')])

      player2.fold()

      table.setCommunityCards([
        createCard('2♦'),
        createCard('3♣'),
        createCard('4♠'),
        createCard('5♥'),
        createCard('7♦'),
      ])

      const winners = dealer.determineWinners()

      expect(winners).toHaveLength(1)
      expect(winners[0]?.player).toBe(player1) // Best pair
      expect(winners.map((w) => w.player)).not.toContain(player2) // Folded
    })

    it('awards win if all but one player folds', () => {
      player1.receiveCards([createCard('2♠'), createCard('3♥')])
      player2.receiveCards([createCard('A♠'), createCard('A♥')])
      player3.receiveCards([createCard('K♠'), createCard('K♥')])

      // Set community cards
      table.setCommunityCards([
        createCard('Q♦'),
        createCard('J♣'),
        createCard('T♠'),
        createCard('9♥'),
        createCard('8♦'),
      ])

      player2.fold()
      player3.fold()

      const winners = dealer.determineWinners()

      expect(winners).toHaveLength(1)
      expect(winners[0]?.player).toBe(player1)
    })

    it('returns empty array if no players', () => {
      player1.fold()
      player2.fold()
      player3.fold()

      const winners = dealer.determineWinners()
      expect(winners).toEqual([])
    })
  })

  describe('pot distribution', () => {
    beforeEach(() => {
      dealer.prepareNewHand()
    })

    it('distributes pot to winner', () => {
      // Setup: player1 wins with better hand
      player1.receiveCards([createCard('A♠'), createCard('A♥')])
      player2.receiveCards([createCard('K♠'), createCard('K♥')])

      table.setCommunityCards([
        createCard('2♦'),
        createCard('3♣'),
        createCard('4♠'),
        createCard('5♥'),
        createCard('7♦'),
      ])

      // Create pot with bets
      const potManager = new PotManager()
      const bets = new Map([
        ['p1', 100],
        ['p2', 100],
      ])
      potManager.collectBets(bets, new Set(), new Set())

      // Get initial chip counts
      const p1ChipsBefore = player1.chips
      const p2ChipsBefore = player2.chips

      // Distribute
      const results = dealer.distributePots(potManager)

      expect(results).toHaveLength(1)
      expect(results[0]?.player).toBe(player1)
      expect(results[0]?.amountWon).toBe(200)

      expect(player1.chips).toBe(p1ChipsBefore + 200)
      expect(player2.chips).toBe(p2ChipsBefore)
    })

    it('splits pot between tied winners', () => {
      // Both players have same hand
      player1.receiveCards([createCard('2♥'), createCard('3♦')])
      player2.receiveCards([createCard('4♣'), createCard('5♠')])

      table.setCommunityCards([
        createCard('A♠'),
        createCard('K♠'),
        createCard('Q♠'),
        createCard('J♠'),
        createCard('T♠'),
      ])

      const potManager = new PotManager()
      const bets = new Map([
        ['p1', 100],
        ['p2', 100],
      ])
      potManager.collectBets(bets, new Set(), new Set())

      const results = dealer.distributePots(potManager)

      expect(results).toHaveLength(2)
      expect(results[0]?.amountWon).toBe(100)
      expect(results[1]?.amountWon).toBe(100)
    })

    it('returns empty array if no winners', () => {
      player1.fold()
      player2.fold()
      player3.fold()

      const potManager = new PotManager()
      const results = dealer.distributePots(potManager)

      expect(results).toEqual([])
    })
  })

  describe('hasEnoughCards', () => {
    it('returns true with fresh deck and 3 players', () => {
      dealer.prepareNewHand()
      expect(dealer.hasEnoughCards()).toBe(true)
    })

    it('returns true after dealing partial hand', () => {
      dealer.prepareNewHand()
      dealer.dealHoleCards()
      dealer.dealFlop()
      expect(dealer.hasEnoughCards()).toBe(true)
    })

    it('returns false if not enough cards remain', () => {
      dealer.prepareNewHand()
      // Deal almost all cards
      dealer.getDeck().dealCards(48)
      expect(dealer.hasEnoughCards()).toBe(false)
    })
  })
})
