import { describe, it, expect, beforeEach } from 'vitest'
import { Player, PlayerAction, PlayerStatus } from './Player'
import { Card, Rank, Suit } from './Card'

describe('Player', () => {
  let player: Player

  beforeEach(() => {
    player = new Player('player1', 'Alice', 1000)
  })

  describe('constructor', () => {
    it('creates player with id and name', () => {
      expect(player.id).toBe('player1')
      expect(player.name).toBe('Alice')
    })

    it('initializes with specified chip amount', () => {
      expect(player.chips).toBe(1000)
    })

    it('starts with no cards', () => {
      expect(player.hasCards).toBe(false)
      expect(player.getHoleCards()).toEqual([])
    })

    it('starts with Active status', () => {
      expect(player.playerStatus).toBe(PlayerStatus.Active)
      expect(player.isActive).toBe(true)
    })

    it('starts with zero current bet', () => {
      expect(player.currentBetAmount).toBe(0)
    })
  })

  describe('chip management', () => {
    describe('addChips', () => {
      it('adds chips to player stack', () => {
        player.addChips(500)
        expect(player.chips).toBe(1500)
      })

      it('throws error for zero chips', () => {
        expect(() => player.addChips(0)).toThrow('Cannot add zero or negative chips')
      })

      it('throws error for negative chips', () => {
        expect(() => player.addChips(-100)).toThrow('Cannot add zero or negative chips')
      })

      it('reactivates eliminated player when chips are added', () => {
        const broke = new Player('p2', 'Broke', 0)
        broke.resetForNewHand()
        expect(broke.isEliminated).toBe(true)

        broke.addChips(100)
        expect(broke.playerStatus).toBe(PlayerStatus.Active)
      })
    })

    describe('removeChips', () => {
      it('removes chips from player stack', () => {
        const removed = player.removeChips(300)
        expect(removed).toBe(300)
        expect(player.chips).toBe(700)
      })

      it('cannot remove more than available (returns available amount)', () => {
        const removed = player.removeChips(1500)
        expect(removed).toBe(1000)
        expect(player.chips).toBe(0)
      })

      it('throws error for zero chips', () => {
        expect(() => player.removeChips(0)).toThrow('Cannot remove zero or negative chips')
      })

      it('throws error for negative chips', () => {
        expect(() => player.removeChips(-50)).toThrow('Cannot remove zero or negative chips')
      })
    })

    describe('getChipStack', () => {
      it('returns a copy of the chip stack', () => {
        const stack = player.getChipStack()
        expect(stack.totalValue).toBe(1000)
      })
    })
  })

  describe('card management', () => {
    const testCards = [new Card(Rank.Ace, Suit.Spades), new Card(Rank.King, Suit.Hearts)]

    describe('receiveCards', () => {
      it('gives cards to player', () => {
        player.receiveCards(testCards)
        expect(player.hasCards).toBe(true)
        expect(player.getHoleCards()).toHaveLength(2)
      })

      it('replaces existing cards', () => {
        player.receiveCards(testCards)
        const newCards = [new Card(Rank.Two, Suit.Clubs)]
        player.receiveCards(newCards)
        expect(player.getHoleCards()).toHaveLength(1)
      })
    })

    describe('getHoleCards', () => {
      it('returns player cards', () => {
        player.receiveCards(testCards)
        const cards = player.getHoleCards()
        expect(cards[0]?.equals(testCards[0]!)).toBe(true)
        expect(cards[1]?.equals(testCards[1]!)).toBe(true)
      })

      it('returns empty array when folded', () => {
        player.receiveCards(testCards)
        player.fold()
        expect(player.getHoleCards()).toEqual([])
      })

      it('returns empty array when sitting out', () => {
        player.receiveCards(testCards)
        player.sitOut()
        expect(player.getHoleCards()).toEqual([])
      })
    })

    describe('clearCards', () => {
      it('removes all cards from player', () => {
        player.receiveCards(testCards)
        player.clearCards()
        expect(player.hasCards).toBe(false)
      })
    })
  })

  describe('betting actions', () => {
    beforeEach(() => {
      player = new Player('p1', 'Alice', 1000)
    })

    describe('fold', () => {
      it('changes status to Folded', () => {
        player.fold()
        expect(player.hasFolded).toBe(true)
        expect(player.playerStatus).toBe(PlayerStatus.Folded)
      })

      it('clears player cards', () => {
        const cards = [new Card(Rank.Ace, Suit.Spades), new Card(Rank.King, Suit.Hearts)]
        player.receiveCards(cards)
        player.fold()
        expect(player.hasCards).toBe(false)
      })

      it('throws error when not active', () => {
        player.fold()
        expect(() => player.fold()).toThrow('Cannot fold: player is FOLDED')
      })
    })

    describe('check', () => {
      it('allows check when no bet to call', () => {
        expect(() => player.check()).not.toThrow()
      })

      it('allows check regardless of current bet (validation happens at game logic level)', () => {
        player.bet(100)
        player.resetBet()
        // Player.check() no longer validates if there's a bet to call
        // That validation should happen at the game logic level by checking callAmount
        player.bet(50)
        expect(() => player.check()).not.toThrow()
      })

      it('throws error when not active', () => {
        player.fold()
        expect(() => player.check()).toThrow('Cannot check: player is FOLDED')
      })
    })

    describe('call', () => {
      it('matches the current bet', () => {
        const betAmount = 200
        player.call(betAmount)
        expect(player.currentBetAmount).toBe(200)
        expect(player.chips).toBe(800)
      })

      it('goes all-in if not enough chips', () => {
        const betAmount = 1500
        const actualCall = player.call(betAmount)
        expect(actualCall).toBe(1000)
        expect(player.chips).toBe(0)
        expect(player.isAllIn).toBe(true)
      })

      it('adds to existing bet in same round', () => {
        player.bet(100)
        player.call(200)
        expect(player.currentBetAmount).toBe(200)
        expect(player.chips).toBe(800)
      })

      it('throws error when not active', () => {
        player.fold()
        expect(() => player.call(100)).toThrow('Cannot call: player is FOLDED')
      })
    })

    describe('bet', () => {
      it('places a bet', () => {
        const amount = player.bet(150)
        expect(amount).toBe(150)
        expect(player.currentBetAmount).toBe(150)
        expect(player.chips).toBe(850)
      })

      it('goes all-in if betting all chips', () => {
        player.bet(1000)
        expect(player.chips).toBe(0)
        expect(player.isAllIn).toBe(true)
      })

      it('throws error when already bet this round', () => {
        player.bet(100)
        expect(() => player.bet(100)).toThrow(
          'Cannot bet after already betting (use raise instead)'
        )
      })

      it('throws error when not active', () => {
        player.sitOut()
        expect(() => player.bet(100)).toThrow('Cannot bet: player is SITTING_OUT')
      })
    })

    describe('raise', () => {
      it('raises the bet', () => {
        player.bet(100) // Chips: 900, Bet: 100
        player.resetBet() // Chips: 900, Bet: 0
        player.call(100) // Chips: 800, Bet: 100
        const raiseAmount = player.raise(200) // Chips: 700, Bet: 200
        expect(raiseAmount).toBe(100) // Added 100 more
        expect(player.currentBetAmount).toBe(200)
        expect(player.chips).toBe(700) // 900 - 100 (first bet) - 100 (raise)
      })

      it('goes all-in if raising all chips', () => {
        player.raise(1000)
        expect(player.chips).toBe(0)
        expect(player.isAllIn).toBe(true)
      })

      it('throws error when not active', () => {
        player.fold()
        expect(() => player.raise(200)).toThrow('Cannot raise: player is FOLDED')
      })
    })

    describe('allIn', () => {
      it('bets all remaining chips', () => {
        const amount = player.allIn()
        expect(amount).toBe(1000)
        expect(player.chips).toBe(0)
        expect(player.isAllIn).toBe(true)
      })

      it('includes any existing bet', () => {
        player.bet(200)
        const amount = player.allIn()
        expect(amount).toBe(800) // Remaining chips
        expect(player.currentBetAmount).toBe(1000)
      })

      it('throws error when not active', () => {
        player.sitOut()
        expect(() => player.allIn()).toThrow('Cannot go all-in: player is SITTING_OUT')
      })
    })

    describe('resetBet', () => {
      it('resets current bet to zero', () => {
        player.bet(200)
        player.resetBet()
        expect(player.currentBetAmount).toBe(0)
      })
    })
  })

  describe('status management', () => {
    describe('status properties', () => {
      it('correctly reports active status', () => {
        expect(player.isActive).toBe(true)
        expect(player.hasFolded).toBe(false)
        expect(player.isAllIn).toBe(false)
      })

      it('correctly reports folded status', () => {
        player.fold()
        expect(player.isActive).toBe(false)
        expect(player.hasFolded).toBe(true)
      })

      it('correctly reports all-in status', () => {
        player.allIn()
        expect(player.isActive).toBe(false)
        expect(player.isAllIn).toBe(true)
      })

      it('correctly reports eliminated status', () => {
        player.allIn()
        player.resetForNewHand()
        expect(player.isEliminated).toBe(true)
      })
    })

    describe('resetForNewHand', () => {
      it('clears cards and bet', () => {
        const cards = [new Card(Rank.Ace, Suit.Spades)]
        player.receiveCards(cards)
        player.bet(100)

        player.resetForNewHand()
        expect(player.hasCards).toBe(false)
        expect(player.currentBetAmount).toBe(0)
      })

      it('resets folded player to active', () => {
        player.fold()
        player.resetForNewHand()
        expect(player.isActive).toBe(true)
      })

      it('resets all-in player to active if has chips', () => {
        player.bet(500)
        player.resetBet()
        player.allIn()
        player.addChips(500) // Won the pot
        player.resetForNewHand()
        expect(player.isActive).toBe(true)
      })

      it('sets to eliminated if no chips', () => {
        player.allIn() // Lost the hand
        player.resetForNewHand()
        expect(player.isEliminated).toBe(true)
      })

      it('does not change sitting out status', () => {
        player.sitOut()
        player.resetForNewHand()
        expect(player.playerStatus).toBe(PlayerStatus.SittingOut)
      })
    })

    describe('sitOut and sitIn', () => {
      it('sitOut changes status and clears cards', () => {
        const cards = [new Card(Rank.Ace, Suit.Spades)]
        player.receiveCards(cards)

        player.sitOut()
        expect(player.playerStatus).toBe(PlayerStatus.SittingOut)
        expect(player.hasCards).toBe(false)
      })

      it('sitIn returns player to active', () => {
        player.sitOut()
        player.sitIn()
        expect(player.isActive).toBe(true)
      })

      it('sitIn does not activate player with no chips', () => {
        player.allIn()
        player.resetForNewHand()
        player.sitIn()
        expect(player.isActive).toBe(false)
      })
    })
  })

  describe('complex scenarios', () => {
    it('handles a complete betting round', () => {
      const p1 = new Player('1', 'Alice', 1000)
      const p2 = new Player('2', 'Bob', 1000)

      // Alice bets 100
      p1.bet(100)
      expect(p1.chips).toBe(900)

      // Bob calls 100
      p2.call(100)
      expect(p2.chips).toBe(900)

      // Reset for next round
      p1.resetBet()
      p2.resetBet()

      // Alice bets 200
      p1.bet(200)
      // Bob raises to 400
      p2.raise(400)
      // Alice calls
      p1.call(400)

      expect(p1.currentBetAmount).toBe(400)
      expect(p2.currentBetAmount).toBe(400)
      expect(p1.chips).toBe(500)
      expect(p2.chips).toBe(500)
    })

    it('handles short stack all-in', () => {
      const shortStack = new Player('short', 'Short', 50)
      const bigStack = new Player('big', 'Big', 1000)

      bigStack.bet(200)
      shortStack.call(200) // Only has 50

      expect(shortStack.chips).toBe(0)
      expect(shortStack.isAllIn).toBe(true)
      expect(shortStack.currentBetAmount).toBe(50)
    })
  })
})
