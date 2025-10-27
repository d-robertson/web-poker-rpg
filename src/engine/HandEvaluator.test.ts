import { describe, it, expect } from 'vitest'
import { HandEvaluator } from './HandEvaluator'
import { HandRank } from './HandRanking'
import { createCard } from '../models/Card'

describe('HandEvaluator', () => {
  describe('evaluateHand - 5 cards', () => {
    it('throws error if not exactly 5 cards', () => {
      expect(() => HandEvaluator.evaluateHand([createCard('A♠')])).toThrow(
        'Expected 5 cards, got 1'
      )
      expect(() =>
        HandEvaluator.evaluateHand([
          createCard('A♠'),
          createCard('K♠'),
          createCard('Q♠'),
          createCard('J♠'),
        ])
      ).toThrow('Expected 5 cards, got 4')
    })

    describe('Royal Flush', () => {
      it('detects royal flush in spades', () => {
        const cards = [
          createCard('A♠'),
          createCard('K♠'),
          createCard('Q♠'),
          createCard('J♠'),
          createCard('T♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.RoyalFlush)
        expect(hand.name).toBe('Royal Flush')
      })

      it('detects royal flush in hearts', () => {
        const cards = [
          createCard('A♥'),
          createCard('K♥'),
          createCard('Q♥'),
          createCard('J♥'),
          createCard('T♥'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.RoyalFlush)
      })
    })

    describe('Straight Flush', () => {
      it('detects king-high straight flush', () => {
        const cards = [
          createCard('K♦'),
          createCard('Q♦'),
          createCard('J♦'),
          createCard('T♦'),
          createCard('9♦'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.StraightFlush)
        expect(hand.primaryValue).toBe(13) // King
      })

      it('detects five-high straight flush (wheel)', () => {
        const cards = [
          createCard('5♣'),
          createCard('4♣'),
          createCard('3♣'),
          createCard('2♣'),
          createCard('A♣'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.StraightFlush)
        expect(hand.primaryValue).toBe(5) // 5 is high in wheel
      })

      it('detects seven-high straight flush', () => {
        const cards = [
          createCard('7♥'),
          createCard('6♥'),
          createCard('5♥'),
          createCard('4♥'),
          createCard('3♥'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.StraightFlush)
        expect(hand.primaryValue).toBe(7)
      })
    })

    describe('Four of a Kind', () => {
      it('detects four aces', () => {
        const cards = [
          createCard('A♠'),
          createCard('A♥'),
          createCard('A♦'),
          createCard('A♣'),
          createCard('K♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.FourOfAKind)
        expect(hand.primaryValue).toBe(14) // Ace
        expect(hand.kickers[0]).toBe(13) // King kicker
      })

      it('detects four sevens', () => {
        const cards = [
          createCard('7♠'),
          createCard('7♥'),
          createCard('7♦'),
          createCard('7♣'),
          createCard('2♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.FourOfAKind)
        expect(hand.primaryValue).toBe(7)
      })
    })

    describe('Full House', () => {
      it('detects aces full of kings', () => {
        const cards = [
          createCard('A♠'),
          createCard('A♥'),
          createCard('A♦'),
          createCard('K♣'),
          createCard('K♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.FullHouse)
        expect(hand.primaryValue).toBe(14) // Aces
        expect(hand.secondaryValue).toBe(13) // Kings
      })

      it('detects threes full of twos', () => {
        const cards = [
          createCard('3♠'),
          createCard('3♥'),
          createCard('3♦'),
          createCard('2♣'),
          createCard('2♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.FullHouse)
        expect(hand.primaryValue).toBe(3)
        expect(hand.secondaryValue).toBe(2)
      })
    })

    describe('Flush', () => {
      it('detects ace-high flush', () => {
        const cards = [
          createCard('A♠'),
          createCard('J♠'),
          createCard('9♠'),
          createCard('6♠'),
          createCard('3♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.Flush)
        expect(hand.primaryValue).toBe(14) // Ace
      })

      it('detects king-high flush', () => {
        const cards = [
          createCard('K♥'),
          createCard('Q♥'),
          createCard('T♥'),
          createCard('7♥'),
          createCard('2♥'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.Flush)
        expect(hand.primaryValue).toBe(13) // King
      })
    })

    describe('Straight', () => {
      it('detects ace-high straight (broadway)', () => {
        const cards = [
          createCard('A♠'),
          createCard('K♥'),
          createCard('Q♦'),
          createCard('J♣'),
          createCard('T♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.Straight)
        expect(hand.primaryValue).toBe(14) // Ace
      })

      it('detects five-high straight (wheel)', () => {
        const cards = [
          createCard('5♠'),
          createCard('4♥'),
          createCard('3♦'),
          createCard('2♣'),
          createCard('A♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.Straight)
        expect(hand.primaryValue).toBe(5) // 5 is high in wheel
      })

      it('detects nine-high straight', () => {
        const cards = [
          createCard('9♠'),
          createCard('8♥'),
          createCard('7♦'),
          createCard('6♣'),
          createCard('5♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.Straight)
        expect(hand.primaryValue).toBe(9)
      })
    })

    describe('Three of a Kind', () => {
      it('detects three queens', () => {
        const cards = [
          createCard('Q♠'),
          createCard('Q♥'),
          createCard('Q♦'),
          createCard('A♣'),
          createCard('K♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.ThreeOfAKind)
        expect(hand.primaryValue).toBe(12) // Queen
        expect(hand.kickers).toEqual([14, 13]) // A, K
      })

      it('detects three fours', () => {
        const cards = [
          createCard('4♠'),
          createCard('4♥'),
          createCard('4♦'),
          createCard('9♣'),
          createCard('2♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.ThreeOfAKind)
        expect(hand.primaryValue).toBe(4)
      })
    })

    describe('Two Pair', () => {
      it('detects aces and kings', () => {
        const cards = [
          createCard('A♠'),
          createCard('A♥'),
          createCard('K♦'),
          createCard('K♣'),
          createCard('Q♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.TwoPair)
        expect(hand.primaryValue).toBe(14) // Aces
        expect(hand.secondaryValue).toBe(13) // Kings
        expect(hand.kickers[0]).toBe(12) // Queen
      })

      it('detects jacks and fours', () => {
        const cards = [
          createCard('J♠'),
          createCard('J♥'),
          createCard('4♦'),
          createCard('4♣'),
          createCard('2♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.TwoPair)
        expect(hand.primaryValue).toBe(11) // Jacks
        expect(hand.secondaryValue).toBe(4) // Fours
      })
    })

    describe('Pair', () => {
      it('detects pair of aces', () => {
        const cards = [
          createCard('A♠'),
          createCard('A♥'),
          createCard('K♦'),
          createCard('Q♣'),
          createCard('J♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.Pair)
        expect(hand.primaryValue).toBe(14) // Ace
        expect(hand.kickers).toEqual([13, 12, 11]) // K, Q, J
      })

      it('detects pair of twos', () => {
        const cards = [
          createCard('2♠'),
          createCard('2♥'),
          createCard('K♦'),
          createCard('Q♣'),
          createCard('J♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.Pair)
        expect(hand.primaryValue).toBe(2)
      })
    })

    describe('High Card', () => {
      it('detects ace high', () => {
        const cards = [
          createCard('A♠'),
          createCard('K♥'),
          createCard('Q♦'),
          createCard('J♣'),
          createCard('9♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.HighCard)
        expect(hand.primaryValue).toBe(14) // Ace
        expect(hand.kickers).toEqual([13, 12, 11, 9])
      })

      it('detects seven high', () => {
        const cards = [
          createCard('7♠'),
          createCard('5♥'),
          createCard('4♦'),
          createCard('3♣'),
          createCard('2♠'),
        ]
        const hand = HandEvaluator.evaluateHand(cards)
        expect(hand.rank).toBe(HandRank.HighCard)
        expect(hand.primaryValue).toBe(7)
      })
    })
  })

  describe('hand comparison', () => {
    it('higher rank beats lower rank', () => {
      const flush = HandEvaluator.evaluateHand([
        createCard('A♠'),
        createCard('K♠'),
        createCard('Q♠'),
        createCard('J♠'),
        createCard('9♠'),
      ])

      const straight = HandEvaluator.evaluateHand([
        createCard('A♠'),
        createCard('K♥'),
        createCard('Q♦'),
        createCard('J♣'),
        createCard('T♠'),
      ])

      expect(flush.compareTo(straight)).toBeGreaterThan(0)
      expect(straight.compareTo(flush)).toBeLessThan(0)
    })

    it('same rank compares by primary value', () => {
      const acePair = HandEvaluator.evaluateHand([
        createCard('A♠'),
        createCard('A♥'),
        createCard('K♦'),
        createCard('Q♣'),
        createCard('J♠'),
      ])

      const kingPair = HandEvaluator.evaluateHand([
        createCard('K♠'),
        createCard('K♥'),
        createCard('Q♦'),
        createCard('J♣'),
        createCard('T♠'),
      ])

      expect(acePair.compareTo(kingPair)).toBeGreaterThan(0)
    })

    it('same pair compares by kickers', () => {
      const aceKingKicker = HandEvaluator.evaluateHand([
        createCard('A♠'),
        createCard('A♥'),
        createCard('K♦'),
        createCard('Q♣'),
        createCard('J♠'),
      ])

      const aceQueenKicker = HandEvaluator.evaluateHand([
        createCard('A♠'),
        createCard('A♥'),
        createCard('Q♦'),
        createCard('J♣'),
        createCard('T♠'),
      ])

      expect(aceKingKicker.compareTo(aceQueenKicker)).toBeGreaterThan(0)
    })

    it('identical hands are equal', () => {
      const hand1 = HandEvaluator.evaluateHand([
        createCard('A♠'),
        createCard('K♠'),
        createCard('Q♠'),
        createCard('J♠'),
        createCard('T♠'),
      ])

      const hand2 = HandEvaluator.evaluateHand([
        createCard('A♥'),
        createCard('K♥'),
        createCard('Q♥'),
        createCard('J♥'),
        createCard('T♥'),
      ])

      expect(hand1.compareTo(hand2)).toBe(0)
    })
  })

  describe('evaluateBest7CardHand', () => {
    it('throws error if not exactly 7 cards', () => {
      expect(() =>
        HandEvaluator.evaluateBest7CardHand([
          createCard('A♠'),
          createCard('K♠'),
          createCard('Q♠'),
          createCard('J♠'),
          createCard('T♠'),
        ])
      ).toThrow('Expected 7 cards, got 5')
    })

    it('finds best hand from 7 cards', () => {
      // 2 hole cards + 5 community cards
      // Should find the flush
      const cards = [
        createCard('A♠'), // Hole
        createCard('K♠'), // Hole
        createCard('Q♠'), // Board
        createCard('J♠'), // Board
        createCard('9♠'), // Board
        createCard('8♥'), // Board
        createCard('7♦'), // Board
      ]

      const hand = HandEvaluator.evaluateBest7CardHand(cards)
      expect(hand.rank).toBe(HandRank.Flush)
    })

    it('finds full house from trips and two pair', () => {
      const cards = [
        createCard('A♠'), // Hole
        createCard('A♥'), // Hole
        createCard('A♦'), // Board
        createCard('K♣'), // Board
        createCard('K♠'), // Board
        createCard('Q♥'), // Board
        createCard('Q♦'), // Board
      ]

      const hand = HandEvaluator.evaluateBest7CardHand(cards)
      expect(hand.rank).toBe(HandRank.FullHouse)
      expect(hand.primaryValue).toBe(14) // Aces
      expect(hand.secondaryValue).toBe(13) // Kings (better than Queens)
    })

    it('finds straight from scattered cards', () => {
      const cards = [
        createCard('9♠'),
        createCard('8♥'),
        createCard('7♦'),
        createCard('6♣'),
        createCard('5♠'),
        createCard('2♥'),
        createCard('2♦'),
      ]

      const hand = HandEvaluator.evaluateBest7CardHand(cards)
      expect(hand.rank).toBe(HandRank.Straight)
      expect(hand.primaryValue).toBe(9)
    })
  })
})
