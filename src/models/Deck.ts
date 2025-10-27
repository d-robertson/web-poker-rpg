import { Card, Rank, Suit } from './Card'

export class Deck {
  private cards: Card[]
  private dealtCards: Card[]

  constructor() {
    this.cards = []
    this.dealtCards = []
    this.reset()
  }

  /**
   * Resets the deck to a full 52-card deck in standard order
   */
  reset(): void {
    this.cards = []
    this.dealtCards = []

    // Create all 52 cards
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
        this.cards.push(new Card(rank, suit))
      }
    }
  }

  /**
   * Shuffles the deck using Fisher-Yates algorithm
   */
  shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.cards[i], this.cards[j]] = [this.cards[j]!, this.cards[i]!]
    }
  }

  /**
   * Deals a single card from the top of the deck
   * @throws Error if deck is empty
   */
  dealCard(): Card {
    const card = this.cards.pop()
    if (!card) {
      throw new Error('Cannot deal from empty deck')
    }
    this.dealtCards.push(card)
    return card
  }

  /**
   * Deals multiple cards from the deck
   * @param count Number of cards to deal
   * @throws Error if not enough cards in deck
   */
  dealCards(count: number): Card[] {
    if (count > this.cards.length) {
      throw new Error(`Cannot deal ${count} cards, only ${this.cards.length} remaining`)
    }

    const dealt: Card[] = []
    for (let i = 0; i < count; i++) {
      dealt.push(this.dealCard())
    }
    return dealt
  }

  /**
   * Burns a card (removes from deck without returning it)
   * Used in poker when dealing community cards
   */
  burnCard(): void {
    this.dealCard() // Just deal it without returning
  }

  /**
   * Gets the number of cards remaining in the deck
   */
  get remainingCards(): number {
    return this.cards.length
  }

  /**
   * Gets the number of cards that have been dealt
   */
  get dealtCount(): number {
    return this.dealtCards.length
  }

  /**
   * Checks if the deck is empty
   */
  get isEmpty(): boolean {
    return this.cards.length === 0
  }

  /**
   * Gets all cards currently in the deck (not dealt)
   * Returns a copy to prevent external modification
   */
  getCards(): Card[] {
    return [...this.cards]
  }

  /**
   * Gets all dealt cards
   * Returns a copy to prevent external modification
   */
  getDealtCards(): Card[] {
    return [...this.dealtCards]
  }
}
