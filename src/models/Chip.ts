export enum ChipDenomination {
  One = 1,
  Five = 5,
  TwentyFive = 25,
  Hundred = 100,
  FiveHundred = 500,
  Thousand = 1000,
  FiveThousand = 5000,
}

export const CHIP_COLORS: Record<ChipDenomination, string> = {
  [ChipDenomination.One]: '#FFFFFF', // White
  [ChipDenomination.Five]: '#FF0000', // Red
  [ChipDenomination.TwentyFive]: '#00FF00', // Green
  [ChipDenomination.Hundred]: '#000000', // Black
  [ChipDenomination.FiveHundred]: '#800080', // Purple
  [ChipDenomination.Thousand]: '#FFD700', // Gold/Yellow
  [ChipDenomination.FiveThousand]: '#FFA500', // Orange
}

export const CHIP_NAMES: Record<ChipDenomination, string> = {
  [ChipDenomination.One]: 'White',
  [ChipDenomination.Five]: 'Red',
  [ChipDenomination.TwentyFive]: 'Green',
  [ChipDenomination.Hundred]: 'Black',
  [ChipDenomination.FiveHundred]: 'Purple',
  [ChipDenomination.Thousand]: 'Yellow',
  [ChipDenomination.FiveThousand]: 'Orange',
}

export class Chip {
  constructor(public readonly denomination: ChipDenomination) {}

  /**
   * Gets the numeric value of the chip
   */
  get value(): number {
    return this.denomination
  }

  /**
   * Gets the color associated with this chip denomination
   */
  get color(): string {
    return CHIP_COLORS[this.denomination]
  }

  /**
   * Gets the name/description of the chip
   */
  get description(): string {
    return `${CHIP_NAMES[this.denomination]} Chip`
  }

  /**
   * Gets a display string for the chip value
   */
  get displayValue(): string {
    if (this.value >= 1000) {
      return `${this.value / 1000}K`
    }
    return this.value.toString()
  }
}

/**
 * Represents a collection of chips
 */
export class ChipStack {
  private chips: Map<ChipDenomination, number>

  constructor(chips: Map<ChipDenomination, number> = new Map()) {
    this.chips = new Map(chips)
  }

  /**
   * Adds chips to the stack
   */
  addChips(denomination: ChipDenomination, count: number): void {
    if (count < 0) {
      throw new Error('Cannot add negative chips')
    }
    const current = this.chips.get(denomination) ?? 0
    this.chips.set(denomination, current + count)
  }

  /**
   * Removes chips from the stack
   * @throws Error if not enough chips of that denomination
   */
  removeChips(denomination: ChipDenomination, count: number): void {
    if (count < 0) {
      throw new Error('Cannot remove negative chips')
    }
    const current = this.chips.get(denomination) ?? 0
    if (current < count) {
      throw new Error(
        `Not enough ${CHIP_NAMES[denomination]} chips. Have ${current}, need ${count}`
      )
    }
    this.chips.set(denomination, current - count)
  }

  /**
   * Gets the count of chips for a specific denomination
   */
  getCount(denomination: ChipDenomination): number {
    return this.chips.get(denomination) ?? 0
  }

  /**
   * Gets the total value of all chips in the stack
   */
  get totalValue(): number {
    let total = 0
    for (const [denomination, count] of this.chips.entries()) {
      total += denomination * count
    }
    return total
  }

  /**
   * Gets the total number of physical chips (all denominations)
   */
  get totalChips(): number {
    let total = 0
    for (const count of this.chips.values()) {
      total += count
    }
    return total
  }

  /**
   * Checks if the stack is empty
   */
  get isEmpty(): boolean {
    return this.totalValue === 0
  }

  /**
   * Gets all chip counts as an array for iteration
   */
  getAllChips(): Array<{ denomination: ChipDenomination; count: number }> {
    return Array.from(this.chips.entries()).map(([denomination, count]) => ({
      denomination,
      count,
    }))
  }

  /**
   * Creates a copy of this chip stack
   */
  clone(): ChipStack {
    return new ChipStack(new Map(this.chips))
  }

  /**
   * Clears all chips from the stack
   */
  clear(): void {
    this.chips.clear()
  }
}

/**
 * Helper function to create a chip stack from a total value
 * Uses standard denominations to break down the value
 */
export function createChipStackFromValue(totalValue: number): ChipStack {
  if (totalValue < 0) {
    throw new Error('Cannot create chip stack with negative value')
  }

  const stack = new ChipStack()
  let remaining = totalValue

  // Use largest denominations first
  const denominations = [
    ChipDenomination.FiveThousand,
    ChipDenomination.Thousand,
    ChipDenomination.FiveHundred,
    ChipDenomination.Hundred,
    ChipDenomination.TwentyFive,
    ChipDenomination.Five,
    ChipDenomination.One,
  ]

  for (const denom of denominations) {
    const count = Math.floor(remaining / denom)
    if (count > 0) {
      stack.addChips(denom, count)
      remaining -= count * denom
    }
  }

  return stack
}

/**
 * Helper function to format a chip value for display
 */
export function formatChipValue(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}
