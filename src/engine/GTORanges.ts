import { Position, PreFlopRange } from './GTOTypes'

/**
 * GTO Preflop Ranges for 6-max No-Limit Hold'em Cash Game
 * Based on simplified GTO principles and modern poker strategy
 */
export class GTORanges {
  /**
   * Opening ranges by position (RFI - Raise First In)
   * Ranges get wider as position improves
   */
  static readonly OPENING_RANGES: Record<Position, string[]> = {
    // Early position - tightest range (~15%)
    [Position.UTG]: [
      '99+', // All pocket pairs 99 and better
      'ATs+', // Ace-Ten suited through Ace-King suited
      'KQs', // King-Queen suited
      'AJo+', // Ace-Jack offsuit through Ace-King offsuit
    ],

    // UTG+1 - slightly wider than UTG (~18%)
    [Position.UTG1]: [
      '88+', // Pocket pairs 88 and better
      'A9s+', // Ace-Nine suited and better
      'KJs+', // King-Jack suited and better
      'QJs', // Queen-Jack suited
      'AJo+', // Ace-Jack offsuit and better
      'KQo', // King-Queen offsuit
    ],

    // Middle position (~22%)
    [Position.MP]: [
      '77+', // Pocket pairs 77 and better
      'A7s+', // Ace-Seven suited and better
      'K9s+', // King-Nine suited and better
      'QTs+', // Queen-Ten suited and better
      'JTs', // Jack-Ten suited
      'A9o+', // Ace-Nine offsuit and better
      'KJo+', // King-Jack offsuit and better
    ],

    // Lojack - getting wider (~25%)
    [Position.LJ]: [
      '66+',
      'A5s+',
      'K8s+',
      'Q9s+',
      'J9s+',
      'T9s',
      'A9o+',
      'KTo+',
      'QJo',
    ],

    // Hijack (~28%)
    [Position.HJ]: [
      '55+',
      'A2s+',
      'K7s+',
      'Q8s+',
      'J8s+',
      'T8s+',
      '98s',
      'A8o+',
      'KTo+',
      'QJo',
    ],

    // Cutoff - very wide (~32%)
    [Position.CO]: [
      '44+',
      'A2s+',
      'K5s+',
      'Q7s+',
      'J7s+',
      'T7s+',
      '97s+',
      '87s',
      'A7o+',
      'K9o+',
      'QTo+',
      'JTo',
    ],

    // Button - widest opening range (~45%)
    [Position.BTN]: [
      '22+',
      'A2s+',
      'K2s+',
      'Q4s+',
      'J6s+',
      'T6s+',
      '96s+',
      '86s+',
      '76s',
      '65s',
      'A2o+',
      'K8o+',
      'Q9o+',
      'J9o+',
      'T9o',
    ],

    // Small Blind vs folds - ~36%
    [Position.SB]: [
      '22+',
      'A2s+',
      'K4s+',
      'Q6s+',
      'J7s+',
      'T7s+',
      '97s+',
      '87s',
      'A5o+',
      'K9o+',
      'QTo+',
      'JTo',
    ],

    // Big Blind - Not used for opening (BB already has money in)
    [Position.BB]: [],
  }

  /**
   * 3-bet ranges by position (when facing a raise)
   * More aggressive from later positions and vs weaker positions
   */
  static readonly THREE_BET_RANGES: Record<Position, Record<string, string[]>> = {
    [Position.UTG]: {
      // 3-betting vs UTG+1 or later positions
      default: ['QQ+', 'AKs', 'AKo'],
    },

    [Position.UTG1]: {
      // 3-betting vs MP or later
      default: ['JJ+', 'AQs+', 'AKo'],
    },

    [Position.MP]: {
      // 3-betting vs LJ or later
      default: ['TT+', 'AJs+', 'KQs', 'AQo+'],
    },

    [Position.LJ]: {
      default: ['99+', 'ATs+', 'KQs', 'AJo+'],
    },

    [Position.HJ]: {
      default: ['88+', 'A9s+', 'KJs+', 'QJs', 'AJo+', 'KQo'],
    },

    [Position.CO]: {
      // vs Button
      vsBTN: ['77+', 'A7s+', 'K9s+', 'QTs+', 'JTs', 'A9o+', 'KJo+'],
      // vs earlier positions
      default: ['88+', 'A9s+', 'KJs+', 'QJs', 'ATo+', 'KQo'],
    },

    [Position.BTN]: {
      // vs SB
      vsSB: ['55+', 'A5s+', 'K8s+', 'Q9s+', 'J9s+', 'T9s', 'A8o+', 'KTo+', 'QJo'],
      // vs CO or earlier
      default: ['77+', 'A7s+', 'K9s+', 'QTs+', 'JTs', 'A9o+', 'KTo+'],
    },

    [Position.SB]: {
      // SB 3-bet range vs any position
      default: ['88+', 'A9s+', 'KJs+', 'QJs', 'AJo+', 'KQo'],
    },

    [Position.BB]: {
      // BB 3-bet range vs any position
      vsBTN: ['77+', 'A5s+', 'K9s+', 'Q9s+', 'J9s+', 'T9s', 'A9o+', 'KTo+', 'QJo'],
      vsSB: ['77+', 'A7s+', 'K9s+', 'QTs+', 'JTs', 'A9o+', 'KTo+'],
      default: ['99+', 'A9s+', 'KJs+', 'QJs', 'AJo+', 'KQo'],
    },
  }

  /**
   * Calling ranges when facing a raise (cold call)
   * Generally call with speculative hands and some premiums
   */
  static readonly CALLING_RANGES: Record<Position, Record<string, string[]>> = {
    [Position.UTG]: {
      // Cold calling from UTG is rare - mostly 3-bet or fold
      default: ['TT-JJ', 'AQs', 'KQs'],
    },

    [Position.UTG1]: {
      default: ['99-JJ', 'AJs+', 'KQs'],
    },

    [Position.MP]: {
      default: ['77-JJ', 'A9s-AJs', 'KTs+', 'QJs'],
    },

    [Position.LJ]: {
      default: ['66-99', 'A7s-ATs', 'K9s+', 'QTs+', 'JTs'],
    },

    [Position.HJ]: {
      default: ['55-88', 'A5s-A9s', 'K8s+', 'Q9s+', 'J9s+', 'T9s'],
    },

    [Position.CO]: {
      default: ['44-77', 'A2s-A7s', 'K7s+', 'Q8s+', 'J8s+', 'T8s+', '98s'],
    },

    [Position.BTN]: {
      // BTN can call very wide vs weak opens
      default: ['22-66', 'A2s-A5s', 'K5s-K8s', 'Q7s+', 'J7s+', 'T7s+', '97s+', '87s', '76s'],
    },

    [Position.SB]: {
      // SB usually 3-bets or folds, but can call some hands
      default: ['44-77', 'A5s-A8s', 'K8s+', 'Q9s+', 'J9s+', 'T9s'],
    },

    [Position.BB]: {
      // BB defends very wide (already has 1BB invested)
      vsBTN: [
        '22+',
        'A2s+',
        'K2s+',
        'Q2s+',
        'J4s+',
        'T6s+',
        '96s+',
        '86s+',
        '76s',
        '65s',
        'A2o+',
        'K5o+',
        'Q8o+',
        'J8o+',
        'T8o+',
        '98o',
      ],
      vsSB: [
        '22+',
        'A2s+',
        'K2s+',
        'Q5s+',
        'J7s+',
        'T7s+',
        '97s+',
        '87s',
        'A2o+',
        'K7o+',
        'Q9o+',
        'J9o+',
        'T9o',
      ],
      default: [
        '22+',
        'A2s+',
        'K5s+',
        'Q8s+',
        'J8s+',
        'T8s+',
        '98s',
        'A5o+',
        'K9o+',
        'QTo+',
        'JTo',
      ],
    },
  }

  /**
   * 4-bet ranges (re-raising a 3-bet)
   * Very tight, value-heavy ranges
   */
  static readonly FOUR_BET_RANGES: Record<Position, string[]> = {
    [Position.UTG]: ['KK+', 'AKs'],
    [Position.UTG1]: ['KK+', 'AKs'],
    [Position.MP]: ['QQ+', 'AKs', 'AKo'],
    [Position.LJ]: ['QQ+', 'AKs', 'AKo'],
    [Position.HJ]: ['JJ+', 'AKs', 'AKo'],
    [Position.CO]: ['JJ+', 'AQs+', 'AKo'],
    [Position.BTN]: ['TT+', 'AJs+', 'AQo+'],
    [Position.SB]: ['JJ+', 'AQs+', 'AKo'],
    [Position.BB]: ['JJ+', 'AQs+', 'AKo'],
  }

  /**
   * Get the appropriate range based on action type and positions
   */
  static getRange(
    action: 'open' | '3bet' | '4bet' | 'call',
    heroPosition: Position,
    villainPosition?: Position
  ): string[] {
    switch (action) {
      case 'open':
        return this.OPENING_RANGES[heroPosition] || []

      case '3bet': {
        const ranges = this.THREE_BET_RANGES[heroPosition]
        if (!ranges) return []

        // Check for specific matchups (e.g., BTN vs SB)
        if (villainPosition === Position.SB && ranges.vsSB) {
          return ranges.vsSB
        }
        if (villainPosition === Position.BTN && ranges.vsBTN) {
          return ranges.vsBTN
        }

        return ranges.default || []
      }

      case '4bet':
        return this.FOUR_BET_RANGES[heroPosition] || []

      case 'call': {
        const ranges = this.CALLING_RANGES[heroPosition]
        if (!ranges) return []

        // Check for specific matchups
        if (villainPosition === Position.SB && ranges.vsSB) {
          return ranges.vsSB
        }
        if (villainPosition === Position.BTN && ranges.vsBTN) {
          return ranges.vsBTN
        }

        return ranges.default || []
      }

      default:
        return []
    }
  }
}
