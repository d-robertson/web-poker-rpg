import { describe, it, expect } from 'vitest'
import { Card, Rank, Suit, createCard } from './Card'

describe('Card', () => {
  describe('constructor and properties', () => {
    it('creates a card with rank and suit', () => {
      const card = new Card(Rank.Ace, Suit.Spades)
      expect(card.rank).toBe(Rank.Ace)
      expect(card.suit).toBe(Suit.Spades)
    })

    it('has the correct value for number cards', () => {
      expect(new Card(Rank.Two, Suit.Hearts).value).toBe(2)
      expect(new Card(Rank.Five, Suit.Diamonds).value).toBe(5)
      expect(new Card(Rank.Nine, Suit.Clubs).value).toBe(9)
    })

    it('has the correct value for face cards', () => {
      expect(new Card(Rank.Ten, Suit.Spades).value).toBe(10)
      expect(new Card(Rank.Jack, Suit.Hearts).value).toBe(11)
      expect(new Card(Rank.Queen, Suit.Diamonds).value).toBe(12)
      expect(new Card(Rank.King, Suit.Clubs).value).toBe(13)
    })

    it('has value 14 for Ace (high)', () => {
      expect(new Card(Rank.Ace, Suit.Spades).value).toBe(14)
    })
  })

  describe('description', () => {
    it('returns correct description for number cards', () => {
      const card = new Card(Rank.Seven, Suit.Hearts)
      expect(card.description).toBe('Seven of Hearts')
    })

    it('returns correct description for face cards', () => {
      expect(new Card(Rank.Jack, Suit.Diamonds).description).toBe('Jack of Diamonds')
      expect(new Card(Rank.Queen, Suit.Clubs).description).toBe('Queen of Clubs')
      expect(new Card(Rank.King, Suit.Spades).description).toBe('King of Spades')
    })

    it('returns correct description for Ace', () => {
      expect(new Card(Rank.Ace, Suit.Spades).description).toBe('Ace of Spades')
    })
  })

  describe('shorthand', () => {
    it('returns correct shorthand notation', () => {
      expect(new Card(Rank.Ace, Suit.Spades).shorthand).toBe('A♠')
      expect(new Card(Rank.King, Suit.Hearts).shorthand).toBe('K♥')
      expect(new Card(Rank.Ten, Suit.Diamonds).shorthand).toBe('T♦')
      expect(new Card(Rank.Two, Suit.Clubs).shorthand).toBe('2♣')
    })
  })

  describe('compareTo', () => {
    it('returns negative when this card is lower rank', () => {
      const lowCard = new Card(Rank.Five, Suit.Spades)
      const highCard = new Card(Rank.King, Suit.Hearts)
      expect(lowCard.compareTo(highCard)).toBeLessThan(0)
    })

    it('returns positive when this card is higher rank', () => {
      const lowCard = new Card(Rank.Three, Suit.Diamonds)
      const highCard = new Card(Rank.Queen, Suit.Clubs)
      expect(highCard.compareTo(lowCard)).toBeGreaterThan(0)
    })

    it('returns 0 when cards have same rank', () => {
      const card1 = new Card(Rank.Seven, Suit.Spades)
      const card2 = new Card(Rank.Seven, Suit.Hearts)
      expect(card1.compareTo(card2)).toBe(0)
    })

    it('considers Ace as highest card', () => {
      const ace = new Card(Rank.Ace, Suit.Spades)
      const king = new Card(Rank.King, Suit.Hearts)
      expect(ace.compareTo(king)).toBeGreaterThan(0)
    })
  })

  describe('hasSameRank', () => {
    it('returns true for cards with same rank', () => {
      const card1 = new Card(Rank.Queen, Suit.Spades)
      const card2 = new Card(Rank.Queen, Suit.Hearts)
      expect(card1.hasSameRank(card2)).toBe(true)
    })

    it('returns false for cards with different rank', () => {
      const card1 = new Card(Rank.Jack, Suit.Diamonds)
      const card2 = new Card(Rank.King, Suit.Diamonds)
      expect(card1.hasSameRank(card2)).toBe(false)
    })
  })

  describe('hasSameSuit', () => {
    it('returns true for cards with same suit', () => {
      const card1 = new Card(Rank.Two, Suit.Clubs)
      const card2 = new Card(Rank.Ace, Suit.Clubs)
      expect(card1.hasSameSuit(card2)).toBe(true)
    })

    it('returns false for cards with different suit', () => {
      const card1 = new Card(Rank.King, Suit.Hearts)
      const card2 = new Card(Rank.King, Suit.Spades)
      expect(card1.hasSameSuit(card2)).toBe(false)
    })
  })

  describe('equals', () => {
    it('returns true for identical cards', () => {
      const card1 = new Card(Rank.Nine, Suit.Diamonds)
      const card2 = new Card(Rank.Nine, Suit.Diamonds)
      expect(card1.equals(card2)).toBe(true)
    })

    it('returns false for cards with same rank but different suit', () => {
      const card1 = new Card(Rank.Four, Suit.Spades)
      const card2 = new Card(Rank.Four, Suit.Hearts)
      expect(card1.equals(card2)).toBe(false)
    })

    it('returns false for cards with different rank but same suit', () => {
      const card1 = new Card(Rank.Six, Suit.Clubs)
      const card2 = new Card(Rank.Eight, Suit.Clubs)
      expect(card1.equals(card2)).toBe(false)
    })
  })

  describe('createCard helper', () => {
    it('creates card from shorthand notation', () => {
      const card = createCard('A♠')
      expect(card.rank).toBe(Rank.Ace)
      expect(card.suit).toBe(Suit.Spades)
    })

    it('creates card from separate rank and suit parameters', () => {
      const card = createCard('K', '♥')
      expect(card.rank).toBe(Rank.King)
      expect(card.suit).toBe(Suit.Hearts)
    })

    it('throws error for invalid shorthand', () => {
      expect(() => createCard('XX')).toThrow('Invalid card shorthand')
    })

    it('throws error for invalid rank or suit', () => {
      expect(() => createCard('Z', '♠')).toThrow('Invalid card')
    })

    it('works for all valid cards', () => {
      expect(createCard('2♣').shorthand).toBe('2♣')
      expect(createCard('T♦').shorthand).toBe('T♦')
      expect(createCard('J♥').shorthand).toBe('J♥')
      expect(createCard('Q♠').shorthand).toBe('Q♠')
    })
  })

  describe('all suits', () => {
    it('defines all four suits correctly', () => {
      expect(Suit.Spades).toBe('♠')
      expect(Suit.Hearts).toBe('♥')
      expect(Suit.Diamonds).toBe('♦')
      expect(Suit.Clubs).toBe('♣')
    })
  })

  describe('all ranks', () => {
    it('defines all 13 ranks correctly', () => {
      expect(Rank.Two).toBe('2')
      expect(Rank.Three).toBe('3')
      expect(Rank.Four).toBe('4')
      expect(Rank.Five).toBe('5')
      expect(Rank.Six).toBe('6')
      expect(Rank.Seven).toBe('7')
      expect(Rank.Eight).toBe('8')
      expect(Rank.Nine).toBe('9')
      expect(Rank.Ten).toBe('T')
      expect(Rank.Jack).toBe('J')
      expect(Rank.Queen).toBe('Q')
      expect(Rank.King).toBe('K')
      expect(Rank.Ace).toBe('A')
    })
  })
})
