export enum Suit {
  Spades = '♠',
  Hearts = '♥',
  Diamonds = '♦',
  Clubs = '♣',
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = 'T',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A',
}

// Mapping for rank comparison (Ace high)
const RANK_VALUES: Record<Rank, number> = {
  [Rank.Two]: 2,
  [Rank.Three]: 3,
  [Rank.Four]: 4,
  [Rank.Five]: 5,
  [Rank.Six]: 6,
  [Rank.Seven]: 7,
  [Rank.Eight]: 8,
  [Rank.Nine]: 9,
  [Rank.Ten]: 10,
  [Rank.Jack]: 11,
  [Rank.Queen]: 12,
  [Rank.King]: 13,
  [Rank.Ace]: 14,
}

export class Card {
  constructor(
    public readonly rank: Rank,
    public readonly suit: Suit
  ) {}

  /**
   * Gets the numeric value of the card's rank (2-14, Ace high)
   */
  get value(): number {
    return RANK_VALUES[this.rank]
  }

  /**
   * Gets a human-readable description of the card
   * Example: "Ace of Spades", "Ten of Hearts"
   */
  get description(): string {
    const rankName = this.getRankName()
    const suitName = this.getSuitName()
    return `${rankName} of ${suitName}`
  }

  /**
   * Gets a short string representation of the card
   * Example: "A♠", "T♥"
   */
  get shorthand(): string {
    return `${this.rank}${this.suit}`
  }

  /**
   * Compares this card to another card by rank value
   * Returns: negative if this < other, 0 if equal, positive if this > other
   */
  compareTo(other: Card): number {
    return this.value - other.value
  }

  /**
   * Checks if this card has the same rank as another card
   */
  hasSameRank(other: Card): boolean {
    return this.rank === other.rank
  }

  /**
   * Checks if this card has the same suit as another card
   */
  hasSameSuit(other: Card): boolean {
    return this.suit === other.suit
  }

  /**
   * Checks if this card is exactly equal to another card (same rank and suit)
   */
  equals(other: Card): boolean {
    return this.rank === other.rank && this.suit === other.suit
  }

  private getRankName(): string {
    switch (this.rank) {
      case Rank.Two:
        return 'Two'
      case Rank.Three:
        return 'Three'
      case Rank.Four:
        return 'Four'
      case Rank.Five:
        return 'Five'
      case Rank.Six:
        return 'Six'
      case Rank.Seven:
        return 'Seven'
      case Rank.Eight:
        return 'Eight'
      case Rank.Nine:
        return 'Nine'
      case Rank.Ten:
        return 'Ten'
      case Rank.Jack:
        return 'Jack'
      case Rank.Queen:
        return 'Queen'
      case Rank.King:
        return 'King'
      case Rank.Ace:
        return 'Ace'
    }
  }

  private getSuitName(): string {
    switch (this.suit) {
      case Suit.Spades:
        return 'Spades'
      case Suit.Hearts:
        return 'Hearts'
      case Suit.Diamonds:
        return 'Diamonds'
      case Suit.Clubs:
        return 'Clubs'
    }
  }
}

/**
 * Helper function to create a card from shorthand notation
 * Example: createCard('A♠') or createCard('A', '♠')
 */
export function createCard(rankOrShorthand: string, suit?: string): Card {
  if (suit) {
    // Two parameter version: createCard('A', '♠')
    const rank = Object.values(Rank).find((r) => r === rankOrShorthand)
    const suitValue = Object.values(Suit).find((s) => s === suit)

    if (!rank || !suitValue) {
      throw new Error(`Invalid card: ${rankOrShorthand}${suit}`)
    }

    return new Card(rank, suitValue)
  } else {
    // Single parameter version: createCard('A♠')
    if (rankOrShorthand.length !== 2) {
      throw new Error(`Invalid card shorthand: ${rankOrShorthand}`)
    }

    const rankChar = rankOrShorthand[0]
    const suitChar = rankOrShorthand[1]

    const rank = Object.values(Rank).find((r) => r === rankChar)
    const suitValue = Object.values(Suit).find((s) => s === suitChar)

    if (!rank || !suitValue) {
      throw new Error(`Invalid card shorthand: ${rankOrShorthand}`)
    }

    return new Card(rank, suitValue)
  }
}
