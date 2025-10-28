import { describe, it, expect } from 'vitest'
import { HandRangeParser } from './HandRangeParser'

describe('HandRangeParser', () => {
  describe('parseHandNotation', () => {
    it('parses pocket pairs', () => {
      expect(HandRangeParser.parseHandNotation('AA')).toEqual(['AA'])
      expect(HandRangeParser.parseHandNotation('KK')).toEqual(['KK'])
    })

    it('parses suited hands', () => {
      expect(HandRangeParser.parseHandNotation('AKs')).toEqual(['AKs'])
      expect(HandRangeParser.parseHandNotation('KQs')).toEqual(['KQs'])
    })

    it('parses offsuit hands', () => {
      expect(HandRangeParser.parseHandNotation('AKo')).toEqual(['AKo'])
      expect(HandRangeParser.parseHandNotation('KQo')).toEqual(['KQo'])
    })

    it('expands pocket pair ranges', () => {
      const result = HandRangeParser.parseHandNotation('99+')
      expect(result).toContain('AA')
      expect(result).toContain('KK')
      expect(result).toContain('QQ')
      expect(result).toContain('JJ')
      expect(result).toContain('TT')
      expect(result).toContain('99')
      expect(result).not.toContain('88')
      expect(result.length).toBe(6)
    })

    it('expands suited hand ranges', () => {
      const result = HandRangeParser.parseHandNotation('ATs+')
      expect(result).toContain('AKs')
      expect(result).toContain('AQs')
      expect(result).toContain('AJs')
      expect(result).toContain('ATs')
      expect(result).not.toContain('A9s')
      expect(result.length).toBe(4)
    })

    it('expands offsuit hand ranges', () => {
      const result = HandRangeParser.parseHandNotation('KTo+')
      expect(result).toContain('KQo')
      expect(result).toContain('KJo')
      expect(result).toContain('KTo')
      expect(result).not.toContain('K9o')
      expect(result.length).toBe(3)
    })
  })

  describe('parseHandRange', () => {
    it('combines multiple hand notations', () => {
      const result = HandRangeParser.parseHandRange(['AA', 'KK', 'AKs'])
      expect(result).toContain('AA')
      expect(result).toContain('KK')
      expect(result).toContain('AKs')
      expect(result.length).toBe(3)
    })

    it('combines ranges and individual hands', () => {
      const result = HandRangeParser.parseHandRange(['99+', 'AKs', 'AKo'])
      expect(result).toContain('AA')
      expect(result).toContain('99')
      expect(result).toContain('AKs')
      expect(result).toContain('AKo')
    })

    it('removes duplicates', () => {
      const result = HandRangeParser.parseHandRange(['AA', 'AA', 'KK'])
      expect(result.filter((h) => h === 'AA').length).toBe(1)
      expect(result.length).toBe(2)
    })
  })

  describe('isHandInRange', () => {
    it('checks if hand is in range', () => {
      expect(HandRangeParser.isHandInRange('QQ', ['99+'])).toBe(true)
      expect(HandRangeParser.isHandInRange('88', ['99+'])).toBe(false)
      expect(HandRangeParser.isHandInRange('AKs', ['ATs+', 'KQs'])).toBe(true)
      expect(HandRangeParser.isHandInRange('A9s', ['ATs+'])).toBe(false)
    })
  })

  describe('cardsToHandNotation', () => {
    it('converts pocket pairs', () => {
      expect(HandRangeParser.cardsToHandNotation('A♠', 'A♦')).toBe('AA')
      expect(HandRangeParser.cardsToHandNotation('K♥', 'K♣')).toBe('KK')
    })

    it('converts suited hands', () => {
      expect(HandRangeParser.cardsToHandNotation('A♠', 'K♠')).toBe('AKs')
      expect(HandRangeParser.cardsToHandNotation('K♠', 'A♠')).toBe('AKs') // Order shouldn't matter
    })

    it('converts offsuit hands', () => {
      expect(HandRangeParser.cardsToHandNotation('A♠', 'K♦')).toBe('AKo')
      expect(HandRangeParser.cardsToHandNotation('K♦', 'A♠')).toBe('AKo') // Order shouldn't matter
    })
  })
})
