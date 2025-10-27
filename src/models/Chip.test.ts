import { describe, it, expect, beforeEach } from 'vitest'
import {
  Chip,
  ChipStack,
  ChipDenomination,
  CHIP_COLORS,
  CHIP_NAMES,
  createChipStackFromValue,
  formatChipValue,
} from './Chip'

describe('Chip', () => {
  describe('constructor and properties', () => {
    it('creates a chip with denomination', () => {
      const chip = new Chip(ChipDenomination.Hundred)
      expect(chip.denomination).toBe(ChipDenomination.Hundred)
    })

    it('has correct value for each denomination', () => {
      expect(new Chip(ChipDenomination.One).value).toBe(1)
      expect(new Chip(ChipDenomination.Five).value).toBe(5)
      expect(new Chip(ChipDenomination.TwentyFive).value).toBe(25)
      expect(new Chip(ChipDenomination.Hundred).value).toBe(100)
      expect(new Chip(ChipDenomination.FiveHundred).value).toBe(500)
      expect(new Chip(ChipDenomination.Thousand).value).toBe(1000)
      expect(new Chip(ChipDenomination.FiveThousand).value).toBe(5000)
    })

    it('has correct color for each denomination', () => {
      expect(new Chip(ChipDenomination.One).color).toBe(CHIP_COLORS[ChipDenomination.One])
      expect(new Chip(ChipDenomination.Five).color).toBe(CHIP_COLORS[ChipDenomination.Five])
      expect(new Chip(ChipDenomination.Hundred).color).toBe(CHIP_COLORS[ChipDenomination.Hundred])
    })

    it('has correct description for each denomination', () => {
      expect(new Chip(ChipDenomination.One).description).toBe('White Chip')
      expect(new Chip(ChipDenomination.Five).description).toBe('Red Chip')
      expect(new Chip(ChipDenomination.Hundred).description).toBe('Black Chip')
    })
  })

  describe('displayValue', () => {
    it('shows full number for values under 1000', () => {
      expect(new Chip(ChipDenomination.One).displayValue).toBe('1')
      expect(new Chip(ChipDenomination.Five).displayValue).toBe('5')
      expect(new Chip(ChipDenomination.Hundred).displayValue).toBe('100')
    })

    it('shows K notation for values 1000 and above', () => {
      expect(new Chip(ChipDenomination.Thousand).displayValue).toBe('1K')
      expect(new Chip(ChipDenomination.FiveThousand).displayValue).toBe('5K')
    })
  })
})

describe('ChipStack', () => {
  let stack: ChipStack

  beforeEach(() => {
    stack = new ChipStack()
  })

  describe('constructor', () => {
    it('creates empty stack by default', () => {
      expect(stack.totalValue).toBe(0)
      expect(stack.totalChips).toBe(0)
      expect(stack.isEmpty).toBe(true)
    })

    it('can initialize with existing chips', () => {
      const chips = new Map([[ChipDenomination.Hundred, 5]])
      const newStack = new ChipStack(chips)
      expect(newStack.totalValue).toBe(500)
    })
  })

  describe('addChips', () => {
    it('adds chips to the stack', () => {
      stack.addChips(ChipDenomination.Five, 10)
      expect(stack.getCount(ChipDenomination.Five)).toBe(10)
    })

    it('accumulates chips of the same denomination', () => {
      stack.addChips(ChipDenomination.TwentyFive, 5)
      stack.addChips(ChipDenomination.TwentyFive, 3)
      expect(stack.getCount(ChipDenomination.TwentyFive)).toBe(8)
    })

    it('throws error for negative count', () => {
      expect(() => stack.addChips(ChipDenomination.Five, -5)).toThrow(
        'Cannot add negative chips'
      )
    })
  })

  describe('removeChips', () => {
    beforeEach(() => {
      stack.addChips(ChipDenomination.Hundred, 10)
    })

    it('removes chips from the stack', () => {
      stack.removeChips(ChipDenomination.Hundred, 3)
      expect(stack.getCount(ChipDenomination.Hundred)).toBe(7)
    })

    it('throws error when trying to remove more than available', () => {
      expect(() => stack.removeChips(ChipDenomination.Hundred, 15)).toThrow(
        'Not enough Black chips'
      )
    })

    it('throws error for negative count', () => {
      expect(() => stack.removeChips(ChipDenomination.Hundred, -5)).toThrow(
        'Cannot remove negative chips'
      )
    })

    it('throws error when removing from empty denomination', () => {
      expect(() => stack.removeChips(ChipDenomination.Five, 1)).toThrow(
        'Not enough Red chips'
      )
    })
  })

  describe('getCount', () => {
    it('returns 0 for denominations not in stack', () => {
      expect(stack.getCount(ChipDenomination.Thousand)).toBe(0)
    })

    it('returns correct count for existing denomination', () => {
      stack.addChips(ChipDenomination.Five, 7)
      expect(stack.getCount(ChipDenomination.Five)).toBe(7)
    })
  })

  describe('totalValue', () => {
    it('returns 0 for empty stack', () => {
      expect(stack.totalValue).toBe(0)
    })

    it('calculates correct total for single denomination', () => {
      stack.addChips(ChipDenomination.Hundred, 5)
      expect(stack.totalValue).toBe(500)
    })

    it('calculates correct total for multiple denominations', () => {
      stack.addChips(ChipDenomination.One, 10) // 10
      stack.addChips(ChipDenomination.Five, 8) // 40
      stack.addChips(ChipDenomination.Hundred, 3) // 300
      expect(stack.totalValue).toBe(350)
    })

    it('updates when chips are added or removed', () => {
      stack.addChips(ChipDenomination.TwentyFive, 4)
      expect(stack.totalValue).toBe(100)

      stack.removeChips(ChipDenomination.TwentyFive, 2)
      expect(stack.totalValue).toBe(50)
    })
  })

  describe('totalChips', () => {
    it('returns 0 for empty stack', () => {
      expect(stack.totalChips).toBe(0)
    })

    it('counts total physical chips', () => {
      stack.addChips(ChipDenomination.Five, 5)
      stack.addChips(ChipDenomination.Hundred, 3)
      expect(stack.totalChips).toBe(8)
    })
  })

  describe('isEmpty', () => {
    it('returns true for new stack', () => {
      expect(stack.isEmpty).toBe(true)
    })

    it('returns false when chips are added', () => {
      stack.addChips(ChipDenomination.One, 1)
      expect(stack.isEmpty).toBe(false)
    })

    it('returns true when all chips are removed', () => {
      stack.addChips(ChipDenomination.Five, 5)
      stack.removeChips(ChipDenomination.Five, 5)
      expect(stack.isEmpty).toBe(true)
    })
  })

  describe('getAllChips', () => {
    it('returns empty array for empty stack', () => {
      expect(stack.getAllChips()).toEqual([])
    })

    it('returns all denominations and counts', () => {
      stack.addChips(ChipDenomination.Five, 3)
      stack.addChips(ChipDenomination.Hundred, 2)

      const allChips = stack.getAllChips()
      expect(allChips).toHaveLength(2)
      expect(allChips).toContainEqual({ denomination: ChipDenomination.Five, count: 3 })
      expect(allChips).toContainEqual({ denomination: ChipDenomination.Hundred, count: 2 })
    })
  })

  describe('clone', () => {
    it('creates a copy of the stack', () => {
      stack.addChips(ChipDenomination.TwentyFive, 4)
      stack.addChips(ChipDenomination.Hundred, 2)

      const clone = stack.clone()
      expect(clone.totalValue).toBe(stack.totalValue)
      expect(clone.getCount(ChipDenomination.TwentyFive)).toBe(4)
    })

    it('creates independent copy (modifications do not affect original)', () => {
      stack.addChips(ChipDenomination.Five, 10)

      const clone = stack.clone()
      clone.addChips(ChipDenomination.Five, 5)

      expect(stack.getCount(ChipDenomination.Five)).toBe(10)
      expect(clone.getCount(ChipDenomination.Five)).toBe(15)
    })
  })

  describe('clear', () => {
    it('removes all chips from stack', () => {
      stack.addChips(ChipDenomination.Hundred, 5)
      stack.addChips(ChipDenomination.Thousand, 2)

      stack.clear()
      expect(stack.isEmpty).toBe(true)
      expect(stack.totalValue).toBe(0)
      expect(stack.totalChips).toBe(0)
    })
  })
})

describe('createChipStackFromValue', () => {
  it('creates stack with correct total value', () => {
    const stack = createChipStackFromValue(637)
    expect(stack.totalValue).toBe(637)
  })

  it('uses largest denominations first', () => {
    const stack = createChipStackFromValue(5000)
    expect(stack.getCount(ChipDenomination.FiveThousand)).toBe(1)
    expect(stack.totalChips).toBe(1)
  })

  it('breaks down complex values efficiently', () => {
    const stack = createChipStackFromValue(1673)
    expect(stack.getCount(ChipDenomination.Thousand)).toBe(1)
    expect(stack.getCount(ChipDenomination.FiveHundred)).toBe(1)
    expect(stack.getCount(ChipDenomination.Hundred)).toBe(1)
    expect(stack.getCount(ChipDenomination.TwentyFive)).toBe(2)
    expect(stack.getCount(ChipDenomination.Five)).toBe(4)
    expect(stack.getCount(ChipDenomination.One)).toBe(3)
    expect(stack.totalValue).toBe(1673)
  })

  it('creates empty stack for value 0', () => {
    const stack = createChipStackFromValue(0)
    expect(stack.isEmpty).toBe(true)
  })

  it('throws error for negative value', () => {
    expect(() => createChipStackFromValue(-100)).toThrow(
      'Cannot create chip stack with negative value'
    )
  })
})

describe('formatChipValue', () => {
  it('formats values under 1000 as plain numbers', () => {
    expect(formatChipValue(1)).toBe('1')
    expect(formatChipValue(50)).toBe('50')
    expect(formatChipValue(999)).toBe('999')
  })

  it('formats thousands with K notation', () => {
    expect(formatChipValue(1000)).toBe('1.0K')
    expect(formatChipValue(2500)).toBe('2.5K')
    expect(formatChipValue(10000)).toBe('10.0K')
  })

  it('formats millions with M notation', () => {
    expect(formatChipValue(1000000)).toBe('1.0M')
    expect(formatChipValue(2500000)).toBe('2.5M')
  })
})
