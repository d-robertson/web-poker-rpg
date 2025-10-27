import { Player, PlayerStatus } from './Player'
import { Card } from './Card'

export interface Seat {
  position: number
  player: Player | null
  isEmpty: boolean
}

export interface TableConfig {
  maxSeats: number
  smallBlind: number
  bigBlind: number
}

export class Table {
  private seats: Seat[]
  private buttonPosition: number
  private communityCards: Card[]
  public readonly config: TableConfig

  constructor(config: TableConfig) {
    this.config = config
    this.seats = []
    this.buttonPosition = 0
    this.communityCards = []

    // Initialize seats
    for (let i = 0; i < config.maxSeats; i++) {
      this.seats.push({
        position: i,
        player: null,
        isEmpty: true,
      })
    }
  }

  // ============ Seat Management ============

  /**
   * Adds a player to the table at a specific seat
   */
  seatPlayer(player: Player, seatPosition: number): void {
    if (seatPosition < 0 || seatPosition >= this.config.maxSeats) {
      throw new Error(`Invalid seat position: ${seatPosition}`)
    }

    const seat = this.seats[seatPosition]!

    if (!seat.isEmpty) {
      throw new Error(`Seat ${seatPosition} is already occupied`)
    }

    seat.player = player
    seat.isEmpty = false
  }

  /**
   * Removes a player from the table
   * @returns true if player was removed, false if not found
   */
  removePlayer(playerId: string): boolean {
    const seat = this.seats.find((s) => s.player?.id === playerId)

    if (!seat) {
      return false
    }

    seat.player = null
    seat.isEmpty = true
    return true
  }

  /**
   * Gets a player by their ID
   */
  getPlayer(playerId: string): Player | null {
    const seat = this.seats.find((s) => s.player?.id === playerId)
    return seat?.player ?? null
  }

  /**
   * Gets a player at a specific seat position
   */
  getPlayerAtSeat(position: number): Player | null {
    return this.seats[position]?.player ?? null
  }

  /**
   * Gets all players currently at the table
   */
  getPlayers(): Player[] {
    return this.seats.filter((s) => !s.isEmpty).map((s) => s.player!)
  }

  /**
   * Gets all active players (not folded, not sitting out)
   * Includes players who are all-in
   */
  getActivePlayers(): Player[] {
    return this.getPlayers().filter((p) => {
      const status = p.playerStatus
      return (
        status === PlayerStatus.Active ||
        status === PlayerStatus.AllIn
      )
    })
  }

  /**
   * Gets the number of players at the table
   */
  get playerCount(): number {
    return this.seats.filter((s) => !s.isEmpty).length
  }

  /**
   * Gets all seats
   */
  getSeats(): Seat[] {
    return [...this.seats]
  }

  /**
   * Finds the next available empty seat
   */
  getNextEmptySeat(): number | null {
    const emptySeat = this.seats.find((s) => s.isEmpty)
    return emptySeat?.position ?? null
  }

  // ============ Button and Blind Management ============

  /**
   * Sets the dealer button position
   */
  setButtonPosition(position: number): void {
    if (position < 0 || position >= this.config.maxSeats) {
      throw new Error(`Invalid button position: ${position}`)
    }
    this.buttonPosition = position
  }

  /**
   * Gets the current dealer button position
   */
  getButtonPosition(): number {
    return this.buttonPosition
  }

  /**
   * Moves the dealer button to the next occupied seat
   */
  moveButton(): void {
    let nextPosition = (this.buttonPosition + 1) % this.config.maxSeats

    // Find next occupied seat
    let attempts = 0
    while (this.seats[nextPosition]?.isEmpty && attempts < this.config.maxSeats) {
      nextPosition = (nextPosition + 1) % this.config.maxSeats
      attempts++
    }

    if (attempts >= this.config.maxSeats) {
      throw new Error('No occupied seats to move button to')
    }

    this.buttonPosition = nextPosition
  }

  /**
   * Gets the small blind position (next occupied seat after button)
   * Skips sitting out players
   */
  getSmallBlindPosition(): number | null {
    if (this.playerCount < 2) {
      return null
    }

    // Heads-up: button is small blind
    if (this.playerCount === 2) {
      return this.buttonPosition
    }

    // Multi-way: small blind is next seat after button
    let position = (this.buttonPosition + 1) % this.config.maxSeats
    let attempts = 0

    while (
      (this.seats[position]?.isEmpty ||
       this.seats[position]?.player?.playerStatus === PlayerStatus.SittingOut) &&
      attempts < this.config.maxSeats
    ) {
      position = (position + 1) % this.config.maxSeats
      attempts++
    }

    return attempts < this.config.maxSeats ? position : null
  }

  /**
   * Gets the big blind position
   * Skips sitting out players
   */
  getBigBlindPosition(): number | null {
    if (this.playerCount < 2) {
      return null
    }

    // Heads-up: non-button is big blind
    if (this.playerCount === 2) {
      let position = (this.buttonPosition + 1) % this.config.maxSeats
      let attempts = 0
      while (
        (this.seats[position]?.isEmpty ||
         this.seats[position]?.player?.playerStatus === PlayerStatus.SittingOut) &&
        attempts < this.config.maxSeats
      ) {
        position = (position + 1) % this.config.maxSeats
        attempts++
      }
      return attempts < this.config.maxSeats ? position : null
    }

    // Multi-way: big blind is two seats after button
    const sbPosition = this.getSmallBlindPosition()
    if (sbPosition === null) return null

    let position = (sbPosition + 1) % this.config.maxSeats
    let attempts = 0

    while (
      (this.seats[position]?.isEmpty ||
       this.seats[position]?.player?.playerStatus === PlayerStatus.SittingOut) &&
      attempts < this.config.maxSeats
    ) {
      position = (position + 1) % this.config.maxSeats
      attempts++
    }

    return attempts < this.config.maxSeats ? position : null
  }

  /**
   * Gets the player in the small blind position
   */
  getSmallBlindPlayer(): Player | null {
    const position = this.getSmallBlindPosition()
    return position !== null ? this.getPlayerAtSeat(position) : null
  }

  /**
   * Gets the player in the big blind position
   */
  getBigBlindPlayer(): Player | null {
    const position = this.getBigBlindPosition()
    return position !== null ? this.getPlayerAtSeat(position) : null
  }

  // ============ Community Cards ============

  /**
   * Sets the community cards (for dealer to use)
   */
  setCommunityCards(cards: Card[]): void {
    this.communityCards = [...cards]
  }

  /**
   * Gets the community cards
   */
  getCommunityCards(): Card[] {
    return [...this.communityCards]
  }

  /**
   * Clears the community cards
   */
  clearCommunityCards(): void {
    this.communityCards = []
  }

  // ============ Utility ============

  /**
   * Resets the table for a new hand
   */
  resetForNewHand(): void {
    this.communityCards = []
    // Players reset themselves
    for (const player of this.getPlayers()) {
      player.resetForNewHand()
    }
  }

  /**
   * Gets players in order starting from a position (useful for action order)
   */
  getPlayersInOrder(startPosition: number): Player[] {
    const players: Player[] = []
    let position = startPosition

    for (let i = 0; i < this.config.maxSeats; i++) {
      const seat = this.seats[position]
      if (seat && !seat.isEmpty) {
        players.push(seat.player!)
      }
      position = (position + 1) % this.config.maxSeats
    }

    return players
  }

  /**
   * Gets active players in order starting from a position
   */
  getActivePlayersInOrder(startPosition: number): Player[] {
    return this.getPlayersInOrder(startPosition).filter((p) => p.isActive)
  }
}
