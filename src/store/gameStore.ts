import { create } from 'zustand'
import { Table, TableConfig } from '../models/Table'
import { Player } from '../models/Player'
import { HandManager } from '../engine/HandManager'
import { GameState } from '../engine/GameState'
import { AIPlayer } from '../engine/AIPlayer'

interface GameStore {
  // Core game objects
  table: Table | null
  handManager: HandManager | null
  currentPlayerId: string | null // The human player

  // Game state
  gameState: GameState
  currentPot: number
  communityCards: string[] // Card shorthands for display
  version: number // Used to trigger re-renders
  actionLog: string[] // Log of all game actions for UI display

  // Actions
  initializeGame: (config: TableConfig, humanPlayerId: string) => void
  addPlayer: (player: Player, seatPosition: number) => void
  startHand: () => void
  playerAction: (action: 'fold' | 'check' | 'call' | 'bet' | 'raise', amount?: number) => void
  processAIActions: () => void
  nextBettingRound: () => void
  performShowdown: () => void
  prepareNextHand: () => void
  reset: () => void

  // Queries
  getPlayers: () => Player[]
  getCurrentPlayer: () => Player | null
  getPlayerToAct: () => Player | null
  getCallAmount: (player: Player) => number
  getCurrentBet: () => number
  getMinRaise: () => number
  canPlayerAct: (action: string) => boolean
}

// Helper to log messages to both console and action log
const log = (message: string) => {
  console.log(message) // Keep console log for debugging
  const state = useGameStore.getState()
  const newLog = [...state.actionLog, message]
  // Keep only last 100 messages to prevent memory issues
  if (newLog.length > 100) {
    newLog.shift()
  }
  useGameStore.setState({ actionLog: newLog })
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  table: null,
  handManager: null,
  currentPlayerId: null,
  gameState: GameState.WaitingForPlayers,
  currentPot: 0,
  communityCards: [],
  version: 0,
  actionLog: [],

  // Initialize a new game
  initializeGame: (config: TableConfig, humanPlayerId: string) => {
    const table = new Table(config)
    const handManager = new HandManager(table)

    set({
      table,
      handManager,
      currentPlayerId: humanPlayerId,
      gameState: GameState.WaitingForPlayers,
      currentPot: 0,
      communityCards: [],
    })
  },

  // Add a player to the table
  addPlayer: (player: Player, seatPosition: number) => {
    const { table, handManager, version } = get()
    if (!table || !handManager) {
      throw new Error('Game not initialized')
    }

    table.seatPlayer(player, seatPosition)

    // Check if we have enough players to start
    if (table.getActivePlayers().length >= 2) {
      // Set button position if not set
      if (table.getButtonPosition() === -1) {
        table.setButtonPosition(seatPosition)
      }

      // Transition HandManager to ReadyToStart state
      handManager.setReadyToStart()

      set({ gameState: GameState.ReadyToStart, version: version + 1 })
    } else {
      // Trigger update
      set({ version: version + 1 })
    }
  },

  // Start a new hand
  startHand: () => {
    const { handManager, table } = get()
    if (!handManager || !table) {
      throw new Error('Game not initialized')
    }

    log('🎲 === STARTING NEW HAND ===')
    log(`Hand #${handManager.getHandNumber() + 1}`)

    handManager.startHand()

    const sbPlayer = table.getSmallBlindPlayer()
    const bbPlayer = table.getBigBlindPlayer()
    log(`💰 ${sbPlayer?.name} posts SB: $${sbPlayer?.currentBetAmount}`)
    log(`💰 ${bbPlayer?.name} posts BB: $${bbPlayer?.currentBetAmount}`)
    log(`🃏 Cards dealt to all players`)
    log(`📊 Current pot: $${handManager.getCurrentPot()}`)
    log(`⚡ Preflop betting begins`)

    set({
      gameState: handManager.getState(),
      currentPot: handManager.getCurrentPot(),
      communityCards: table.getCommunityCards().map((c) => c.shorthand),
    })
  },

  // Player performs an action
  playerAction: (action: 'fold' | 'check' | 'call' | 'bet' | 'raise', amount?: number) => {
    const { table, handManager, currentPlayerId, version } = get()
    if (!table || !handManager || !currentPlayerId) {
      throw new Error('Game not initialized')
    }

    const player = table.getPlayer(currentPlayerId)
    if (!player) {
      throw new Error('Player not found')
    }

    const callAmount = handManager.getCallAmount(player)
    const currentBet = handManager.getCurrentBet()

    log(`👤 ${player.name} (HUMAN) action: ${action.toUpperCase()}`)
    log(`   Chips before: $${player.chips}`)
    log(`   Current bet: $${player.currentBetAmount}`)
    log(`   Call amount: $${callAmount}`)
    log(`   Table current bet: $${currentBet}`)

    // Perform the action
    try {
      switch (action) {
        case 'fold':
          player.fold()
          log(`   ❌ Folded`)
          break
        case 'check':
          player.check()
          log(`   ✓ Checked`)
          break
        case 'call': {
          // player.call() expects the TOTAL bet amount to match, not the incremental amount
          player.call(currentBet)
          log(`   📞 Called $${callAmount}`)
          break
        }
        case 'bet':
          if (amount !== undefined) {
            player.bet(amount)
            log(`   💵 Bet $${amount}`)
          }
          break
        case 'raise':
          if (amount !== undefined) {
            player.raise(amount)
            log(`   📈 Raised to $${amount}`)
          }
          break
      }

      log(`   Chips after: $${player.chips}`)
      log(`   Total bet this round: $${player.currentBetAmount}`)

      // Record the action with HandManager for betting tracker
      handManager.recordPlayerAction(currentPlayerId, action, amount)

      // Trigger update
      set({ version: version + 1 })

      // Check if betting round is complete
      if (handManager.isBettingRoundComplete()) {
        log(`✅ Betting round complete!`)
        log(`📊 Pot: $${handManager.getCurrentPot()}\n`)
        // Advance to next round after a short delay
        setTimeout(() => {
          get().nextBettingRound()
        }, 500)
      } else {
        // Continue processing AI actions after a short delay
        setTimeout(() => {
          get().processAIActions()
        }, 800)
      }
    } catch (error) {
      console.error('❌ Action failed:', error)
      throw error
    }
  },

  // Process AI player actions
  processAIActions: () => {
    const { handManager, table, currentPlayerId, version } = get()
    if (!handManager || !table || !currentPlayerId) {
      return
    }

    // Check if it's an AI player's turn
    const playerToAct = handManager.getPlayerToAct()
    if (!playerToAct || playerToAct.id === currentPlayerId) {
      // It's the human player's turn or no one's turn
      return
    }

    const callAmount = handManager.getCallAmount(playerToAct)
    const currentBet = handManager.getCurrentBet()

    log(`\n🤖 ${playerToAct.name} (AI) turn`)
    log(`   Chips before: $${playerToAct.chips}`)
    log(`   Current bet: $${playerToAct.currentBetAmount}`)
    log(`   Call amount: $${callAmount}`)
    log(`   Table current bet: $${currentBet}`)

    // Process AI action
    try {
      const decision = AIPlayer.makeDecision(playerToAct, handManager)
      log(`   🎯 AI Decision: ${decision.action.toUpperCase()}${decision.amount ? ` $${decision.amount}` : ''}`)

      AIPlayer.executeAction(
        playerToAct,
        decision,
        handManager,
        (playerId, action, amount) => {
          handManager.recordPlayerAction(playerId, action, amount)
        }
      )

      log(`   Chips after: $${playerToAct.chips}`)
      log(`   Total bet this round: $${playerToAct.currentBetAmount}`)

      // Trigger update
      set({ version: version + 1 })

      // Check if betting round is complete
      if (handManager.isBettingRoundComplete()) {
        log(`✅ Betting round complete!`)
        log(`📊 Pot: $${handManager.getCurrentPot()}\n`)
        // Advance to next round after a short delay
        setTimeout(() => {
          get().nextBettingRound()
        }, 500)
      } else {
        // Continue processing AI actions after a short delay
        setTimeout(() => {
          get().processAIActions()
        }, 800)
      }
    } catch (error) {
      console.error('❌ AI action failed:', error)
      console.error('   Error details:', error)
    }
  },

  // Move to next betting round
  nextBettingRound: () => {
    const { handManager, table } = get()
    if (!handManager || !table) {
      throw new Error('Game not initialized')
    }

    log('\n🔄 === COMPLETING BETTING ROUND ===')
    handManager.completeBettingRound()

    const newState = handManager.getState()
    const communityCards = table.getCommunityCards()

    log(`📊 Pot collected: $${handManager.getCurrentPot()}`)
    log(`🎮 New state: ${newState}`)
    if (communityCards.length > 0) {
      log(`🃏 Community cards: ${communityCards.map(c => c.shorthand).join(' ')}`)
    }
    log('')

    set({
      gameState: newState,
      currentPot: handManager.getCurrentPot(),
      communityCards: communityCards.map((c) => c.shorthand),
    })

    // If we're in a betting state, start processing AI actions
    const bettingStates = [
      GameState.PreflopBetting,
      GameState.FlopBetting,
      GameState.TurnBetting,
      GameState.RiverBetting,
    ]

    if (bettingStates.includes(newState)) {
      setTimeout(() => {
        get().processAIActions()
      }, 1000)
    } else if (newState === GameState.Showdown) {
      // Perform showdown after a short delay
      setTimeout(() => {
        log('\n🏆 === SHOWDOWN ===')
        const result = get().performShowdown()

        // Log winners
        log(`\n🎉 WINNERS:`)
        for (const winner of result.winners) {
          log(`   ${winner.player.name} wins $${winner.amountWon} with ${winner.hand.description}`)
          log(`   Cards: ${winner.player.getHoleCards().map(c => c.shorthand).join(' ')}`)
          log(`   New chip count: $${winner.player.chips}`)
        }
        log('')

        // Prepare for next hand after showing results
        setTimeout(() => {
          log('🔄 Preparing next hand...')
          get().prepareNextHand()
          // Auto-start next hand
          setTimeout(() => {
            get().startHand()
          }, 1000)
        }, 3000) // Give 3 seconds to see the results
      }, 1000)
    }
  },

  // Perform showdown
  performShowdown: () => {
    const { handManager } = get()
    if (!handManager) {
      throw new Error('Game not initialized')
    }

    const result = handManager.performShowdown()

    set({
      gameState: handManager.getState(),
      currentPot: 0,
    })

    return result
  },

  // Prepare for next hand
  prepareNextHand: () => {
    const { handManager, table } = get()
    if (!handManager || !table) {
      throw new Error('Game not initialized')
    }

    handManager.prepareNextHand()

    set({
      gameState: handManager.getState(),
      currentPot: 0,
      communityCards: [],
    })
  },

  // Reset the game
  reset: () => {
    set({
      table: null,
      handManager: null,
      currentPlayerId: null,
      gameState: GameState.WaitingForPlayers,
      currentPot: 0,
      communityCards: [],
      version: 0,
    })
  },

  // Get all players
  getPlayers: () => {
    const { table } = get()
    return table?.getPlayers() ?? []
  },

  // Get the current human player
  getCurrentPlayer: () => {
    const { table, currentPlayerId } = get()
    if (!table || !currentPlayerId) return null
    return table.getPlayer(currentPlayerId)
  },

  // Get the player who should act next
  getPlayerToAct: () => {
    const { handManager } = get()
    if (!handManager) return null
    return handManager.getPlayerToAct()
  },

  // Get the amount a player needs to call
  getCallAmount: (player: Player) => {
    const { handManager } = get()
    if (!handManager) return 0
    return handManager.getCallAmount(player)
  },

  // Get the current bet amount
  getCurrentBet: () => {
    const { handManager } = get()
    if (!handManager) return 0
    return handManager.getCurrentBet()
  },

  // Get the minimum raise amount
  getMinRaise: () => {
    const { handManager } = get()
    if (!handManager) return 0
    return handManager.getMinRaise()
  },

  // Check if a player can perform an action
  canPlayerAct: (action: string) => {
    const { gameState, table, currentPlayerId } = get()
    if (!table || !currentPlayerId) return false

    const player = table.getPlayer(currentPlayerId)
    if (!player) return false

    // Can only act during betting rounds
    const bettingStates = [
      GameState.PreflopBetting,
      GameState.FlopBetting,
      GameState.TurnBetting,
      GameState.RiverBetting,
    ]

    if (!bettingStates.includes(gameState)) return false

    // TODO: Add more sophisticated action validation
    return true
  },
}))
