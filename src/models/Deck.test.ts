import { describe, it, expect, beforeEach } from 'vitest'
import { Deck } from './Deck'
import { Rank, Suit } from './Card'

describe('Deck', () => {
  let deck: Deck

  beforeEach(() => {
    deck = new Deck()
  })

  describe('constructor', () => {
    it('creates a deck with 52 cards', () => {
      expect(deck.remainingCards).toBe(52)
    })

    it('starts with 0 dealt cards', () => {
      expect(deck.dealtCount).toBe(0)
    })

    it('is not empty initially', () => {
      expect(deck.isEmpty).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets deck to 52 cards after dealing', () => {
      deck.dealCards(10)
      expect(deck.remainingCards).toBe(42)

      deck.reset()
      expect(deck.remainingCards).toBe(52)
      expect(deck.dealtCount).toBe(0)
    })

    it('creates all 52 unique cards', () => {
      const cards = deck.getCards()
      expect(cards.length).toBe(52)

      // Check we have all suits and ranks
      const suits = [Suit.Spades, Suit.Hearts, Suit.Diamonds, Suit.Clubs]
      const ranks = [
        Rank.Two,
        Rank.Three,
        Rank.Four,
        Rank.Five,
        Rank.Six,
        Rank.Seven,
        Rank.Eight,
        Rank.Nine,
        Rank.Ten,
        Rank.Jack,
        Rank.Queen,
        Rank.King,
        Rank.Ace,
      ]

      for (const suit of suits) {
        for (const rank of ranks) {
          const found = cards.find((c) => c.rank === rank && c.suit === suit)
          expect(found).toBeDefined()
        }
      }
    })
  })

  describe('shuffle', () => {
    it('maintains 52 cards after shuffle', () => {
      deck.shuffle()
      expect(deck.remainingCards).toBe(52)
    })

    it('changes the order of cards (statistically)', () => {
      const originalOrder = deck.getCards().map((c) => c.shorthand)
      deck.shuffle()
      const shuffledOrder = deck.getCards().map((c) => c.shorthand)

      // Very unlikely to be in same order (1 in 52! chance)
      expect(originalOrder).not.toEqual(shuffledOrder)
    })

    it('preserves all cards (no duplicates or missing cards)', () => {
      deck.shuffle()
      const cards = deck.getCards()

      // Check count
      expect(cards.length).toBe(52)

      // Check all unique combinations exist
      const shorthands = new Set(cards.map((c) => c.shorthand))
      expect(shorthands.size).toBe(52)
    })
  })

  describe('dealCard', () => {
    it('returns a card', () => {
      const card = deck.dealCard()
      expect(card).toBeDefined()
      expect(card.rank).toBeDefined()
      expect(card.suit).toBeDefined()
    })

    it('reduces remaining cards by 1', () => {
      expect(deck.remainingCards).toBe(52)
      deck.dealCard()
      expect(deck.remainingCards).toBe(51)
    })

    it('increases dealt count by 1', () => {
      expect(deck.dealtCount).toBe(0)
      deck.dealCard()
      expect(deck.dealtCount).toBe(1)
    })

    it('throws error when deck is empty', () => {
      // Deal all 52 cards
      for (let i = 0; i < 52; i++) {
        deck.dealCard()
      }

      expect(() => deck.dealCard()).toThrow('Cannot deal from empty deck')
    })

    it('tracks dealt cards', () => {
      const card1 = deck.dealCard()
      const card2 = deck.dealCard()

      const dealtCards = deck.getDealtCards()
      expect(dealtCards).toHaveLength(2)
      expect(dealtCards[0]?.equals(card1)).toBe(true)
      expect(dealtCards[1]?.equals(card2)).toBe(true)
    })
  })

  describe('dealCards', () => {
    it('deals the correct number of cards', () => {
      const cards = deck.dealCards(5)
      expect(cards).toHaveLength(5)
    })

    it('reduces remaining cards by the count dealt', () => {
      deck.dealCards(10)
      expect(deck.remainingCards).toBe(42)
    })

    it('throws error if not enough cards', () => {
      expect(() => deck.dealCards(53)).toThrow('Cannot deal 53 cards, only 52 remaining')
    })

    it('can deal all remaining cards', () => {
      const cards = deck.dealCards(52)
      expect(cards).toHaveLength(52)
      expect(deck.isEmpty).toBe(true)
    })
  })

  describe('burnCard', () => {
    it('removes a card from the deck', () => {
      expect(deck.remainingCards).toBe(52)
      deck.burnCard()
      expect(deck.remainingCards).toBe(51)
    })

    it('increases dealt count', () => {
      expect(deck.dealtCount).toBe(0)
      deck.burnCard()
      expect(deck.dealtCount).toBe(1)
    })

    it('can be called multiple times', () => {
      deck.burnCard()
      deck.burnCard()
      deck.burnCard()
      expect(deck.remainingCards).toBe(49)
      expect(deck.dealtCount).toBe(3)
    })
  })

  describe('isEmpty', () => {
    it('returns false when cards remain', () => {
      expect(deck.isEmpty).toBe(false)
    })

    it('returns true when all cards are dealt', () => {
      deck.dealCards(52)
      expect(deck.isEmpty).toBe(true)
    })

    it('returns false after reset', () => {
      deck.dealCards(52)
      expect(deck.isEmpty).toBe(true)
      deck.reset()
      expect(deck.isEmpty).toBe(false)
    })
  })

  describe('getCards', () => {
    it('returns a copy of the deck (mutation safe)', () => {
      const cards1 = deck.getCards()
      const cards2 = deck.getCards()

      expect(cards1).toEqual(cards2)
      expect(cards1).not.toBe(cards2) // Different array instances
    })

    it('external modifications do not affect deck', () => {
      const cards = deck.getCards()
      cards.pop()

      expect(deck.remainingCards).toBe(52) // Deck unchanged
    })
  })

  describe('getDealtCards', () => {
    it('returns empty array initially', () => {
      expect(deck.getDealtCards()).toEqual([])
    })

    it('returns all dealt cards', () => {
      const card1 = deck.dealCard()
      const card2 = deck.dealCard()
      const dealtCards = deck.getDealtCards()

      expect(dealtCards).toHaveLength(2)
      expect(dealtCards[0]?.equals(card1)).toBe(true)
      expect(dealtCards[1]?.equals(card2)).toBe(true)
    })

    it('returns a copy (mutation safe)', () => {
      deck.dealCard()
      const dealt1 = deck.getDealtCards()
      const dealt2 = deck.getDealtCards()

      expect(dealt1).toEqual(dealt2)
      expect(dealt1).not.toBe(dealt2) // Different array instances
    })
  })

  describe('poker scenario', () => {
    it('simulates a Texas Holdem hand', () => {
      deck.shuffle()

      // Deal 2 cards to 6 players
      const player1 = deck.dealCards(2)
      const player2 = deck.dealCards(2)
      const player3 = deck.dealCards(2)
      const player4 = deck.dealCards(2)
      const player5 = deck.dealCards(2)
      const player6 = deck.dealCards(2)

      expect(player1).toHaveLength(2)
      expect(deck.remainingCards).toBe(40)

      // Burn and deal flop
      deck.burnCard()
      const flop = deck.dealCards(3)
      expect(flop).toHaveLength(3)
      expect(deck.remainingCards).toBe(36)

      // Burn and deal turn
      deck.burnCard()
      const turn = deck.dealCard()
      expect(deck.remainingCards).toBe(34)

      // Burn and deal river
      deck.burnCard()
      const river = deck.dealCard()
      expect(deck.remainingCards).toBe(32)

      // Total dealt: 12 (players) + 1 + 3 + 1 + 1 + 1 + 1 + 1 = 21 cards (12 player cards + 3 burns + 5 community + 1 extra burn)
      // Wait, let me recalculate: 12 player cards + 3 burns + 5 community = 20
      expect(deck.dealtCount).toBe(20)
    })
  })
})
