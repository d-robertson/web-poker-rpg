import { Deck } from './Deck'
import { Table } from './Table'
import { Player } from './Player'
import { Card } from './Card'
import { HandEvaluator } from '../engine/HandEvaluator'
import { HandRanking, HandRank } from '../engine/HandRanking'
import { PotManager } from '../engine/BettingStructure'

export interface WinnerResult {
  player: Player
  hand: HandRanking
  amountWon: number
}

export class Dealer {
  private deck: Deck
  private table: Table

  constructor(table: Table) {
    this.table = table
    this.deck = new Deck()
  }

  // ============ Deck Management ============

  /**
   * Shuffles the deck and prepares for a new hand
   */
  prepareNewHand(): void {
    this.deck.reset()
    this.deck.shuffle()
    this.table.resetForNewHand()
  }

  /**
   * Burns a card (discards top card)
   */
  burnCard(): void {
    this.deck.burnCard()
  }

  // ============ Card Dealing ============

  /**
   * Deals hole cards to all active players at the table
   * Each player receives 2 cards
   */
  dealHoleCards(): void {
    const players = this.table.getActivePlayers()

    if (players.length < 2) {
      throw new Error('Need at least 2 players to deal')
    }

    // Deal one card to each player, then another (standard dealing procedure)
    for (let round = 0; round < 2; round++) {
      for (const player of players) {
        const card = this.deck.dealCard()
        const existingCards = player.getHoleCards()
        player.receiveCards([...existingCards, card])
      }
    }
  }

  /**
   * Deals the flop (3 community cards)
   * Burns a card first
   */
  dealFlop(): Card[] {
    this.burnCard()
    const flopCards = this.deck.dealCards(3)
    this.table.setCommunityCards(flopCards)
    return flopCards
  }

  /**
   * Deals the turn (1 community card)
   * Burns a card first
   */
  dealTurn(): Card {
    this.burnCard()
    const turnCard = this.deck.dealCard()
    const existingCards = this.table.getCommunityCards()
    this.table.setCommunityCards([...existingCards, turnCard])
    return turnCard
  }

  /**
   * Deals the river (1 community card)
   * Burns a card first
   */
  dealRiver(): Card {
    this.burnCard()
    const riverCard = this.deck.dealCard()
    const existingCards = this.table.getCommunityCards()
    this.table.setCommunityCards([...existingCards, riverCard])
    return riverCard
  }

  // ============ Button Management ============

  /**
   * Moves the dealer button to the next position
   */
  moveButton(): void {
    this.table.moveButton()
  }

  /**
   * Gets the current button position
   */
  getButtonPosition(): number {
    return this.table.getButtonPosition()
  }

  // ============ Winner Determination ============

  /**
   * Determines the winner(s) at showdown
   * Evaluates all active players' hands and returns the best hand(s)
   */
  determineWinners(): Array<{ player: Player; hand: HandRanking }> {
    const players = this.table.getPlayers().filter((p) => !p.hasFolded)
    const communityCards = this.table.getCommunityCards()

    if (players.length === 0) {
      return []
    }

    // If only one player left (others folded), they win by default
    if (players.length === 1) {
      const winner = players[0]!
      const holeCards = winner.getHoleCards()
      const allCards = holeCards.concat(communityCards)

      // Create a dummy hand ranking since they won by fold
      let dummyHand: HandRanking

      if (allCards.length >= 5) {
        // We have enough cards to evaluate
        dummyHand = HandEvaluator.evaluateHand(allCards.slice(0, 5))
      } else {
        // Not enough cards yet (e.g., won preflop), create a dummy HandRanking
        dummyHand = new HandRanking(
          HandRank.HighCard,
          holeCards,
          0, // primaryValue
          0, // secondaryValue
          [] // kickers
        )
      }

      return [{ player: winner, hand: dummyHand }]
    }

    // Evaluate all players' hands
    const playerHands: Array<{ player: Player; hand: HandRanking }> = []

    for (const player of players) {
      const holeCards = player.getHoleCards()
      const allCards = [...holeCards, ...communityCards]

      if (allCards.length < 5) {
        throw new Error(`Player ${player.id} has insufficient cards to evaluate`)
      }

      // Evaluate best 5-card hand from 7 cards (or best 5 from what's available)
      const hand =
        allCards.length === 7
          ? HandEvaluator.evaluateBest7CardHand(allCards)
          : HandEvaluator.evaluateHand(allCards.slice(0, 5))

      playerHands.push({ player, hand })
    }

    // Find the best hand(s)
    const sortedHands = playerHands.sort((a, b) => b.hand.compareTo(a.hand))
    const bestHand = sortedHands[0]!.hand

    // Return all players with the best hand (ties)
    return sortedHands.filter((ph) => ph.hand.compareTo(bestHand) === 0)
  }

  /**
   * Distributes the pot(s) to winner(s)
   * @param potManager The pot manager with all pots to distribute
   * @returns Array of winner results with amounts won
   */
  distributePots(potManager: PotManager): WinnerResult[] {
    const winners = this.determineWinners()

    if (winners.length === 0) {
      return []
    }

    // Convert to format expected by PotManager
    const winnersForPot = winners.map((w) => ({ playerId: w.player.id }))

    // Get winnings from pot manager
    const winnings = potManager.distributePots(winnersForPot)

    // Award chips to winners and create results
    const results: WinnerResult[] = []

    for (const { player, hand } of winners) {
      const amount = winnings.get(player.id) ?? 0

      if (amount > 0) {
        player.addChips(amount)
        results.push({
          player,
          hand,
          amountWon: amount,
        })
      }
    }

    return results
  }

  // ============ Utility ============

  /**
   * Gets the current deck
   */
  getDeck(): Deck {
    return this.deck
  }

  /**
   * Gets the table
   */
  getTable(): Table {
    return this.table
  }

  /**
   * Checks if enough cards remain for a complete hand
   */
  hasEnoughCards(): boolean {
    // Need at least: (2 * players) + 3 burns + 5 community = (2*players) + 8
    const playerCount = this.table.getActivePlayers().length
    const requiredCards = 2 * playerCount + 8
    return this.deck.remainingCards >= requiredCards
  }
}
