import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { Player } from '../models/Player'
import { GameState } from '../engine/GameState'
import { PokerTable } from './PokerTable'
import { PlayerActions } from './PlayerActions'
import { ActionLog } from './ActionLog'

export function PokerGame() {
  const {
    table,
    handManager,
    gameState,
    currentPot,
    communityCards,
    currentPlayerId,
    version, // Subscribe to version for re-renders
    actionLog,
    initializeGame,
    addPlayer,
    startHand,
    playerAction,
    processAIActions,
    nextBettingRound,
    performShowdown,
    prepareNextHand,
    getPlayers,
    getCurrentPlayer,
    getPlayerToAct,
    getCallAmount,
    getMinRaise,
  } = useGameStore()

  // Initialize game on mount
  useEffect(() => {
    if (!table) {
      // Initialize with default config
      initializeGame(
        {
          maxSeats: 6,
          smallBlind: 5,
          bigBlind: 10,
        },
        'human-player'
      )
    }
  }, [table, initializeGame])

  // Add players after table is initialized
  useEffect(() => {
    if (table && table.playerCount === 0) {
      // Add human player
      const humanPlayer = new Player('human-player', 'You', 1000)

      // Add AI players
      const aiPlayers = [
        new Player('ai-1', 'Alice', 1000),
        new Player('ai-2', 'Bob', 1000),
        new Player('ai-3', 'Charlie', 800),
      ]

      try {
        addPlayer(humanPlayer, 0)
        aiPlayers.forEach((player, index) => {
          addPlayer(player, index + 1)
        })
      } catch (error) {
        console.error('Failed to add players:', error)
      }
    }
  }, [table, addPlayer])

  const players = getPlayers()
  const humanPlayer = getCurrentPlayer()
  const buttonPosition = table?.getButtonPosition() ?? -1
  const playerToAct = getPlayerToAct()
  const callAmount = humanPlayer ? getCallAmount(humanPlayer) : 0
  const minRaise = getMinRaise()

  const handleStartHand = () => {
    try {
      startHand()

      // Start processing AI actions after a short delay
      setTimeout(() => {
        processAIActions()
      }, 1000)
    } catch (error) {
      console.error('Failed to start hand:', error)
      alert(error instanceof Error ? error.message : 'Failed to start hand')
    }
  }

  const handlePlayerAction = (action: 'fold' | 'check' | 'call' | 'bet' | 'raise', amount?: number) => {
    try {
      playerAction(action, amount)

      // Start processing AI actions after player acts
      setTimeout(() => {
        processAIActions()
      }, 1000)
    } catch (error) {
      console.error('Action failed:', error)
      alert(error instanceof Error ? error.message : 'Action failed')
    }
  }

  const handleNextRound = () => {
    try {
      if (gameState === GameState.Showdown || gameState === GameState.HandComplete) {
        const result = performShowdown()
        console.log('Showdown result:', result)

        setTimeout(() => {
          prepareNextHand()
        }, 3000)
      } else {
        nextBettingRound()
      }
    } catch (error) {
      console.error('Failed to advance:', error)
    }
  }

  const getStateDescription = () => {
    switch (gameState) {
      case GameState.WaitingForPlayers:
        return 'Waiting for players...'
      case GameState.ReadyToStart:
        return 'Ready to start!'
      case GameState.PostingBlinds:
        return 'Posting blinds...'
      case GameState.DealingHoleCards:
        return 'Dealing hole cards...'
      case GameState.PreflopBetting:
        return 'Preflop Betting'
      case GameState.DealingFlop:
        return 'Dealing flop...'
      case GameState.FlopBetting:
        return 'Flop Betting'
      case GameState.DealingTurn:
        return 'Dealing turn...'
      case GameState.TurnBetting:
        return 'Turn Betting'
      case GameState.DealingRiver:
        return 'Dealing river...'
      case GameState.RiverBetting:
        return 'River Betting'
      case GameState.Showdown:
        return 'Showdown!'
      case GameState.HandComplete:
        return 'Hand Complete'
      case GameState.GameOver:
        return 'Game Over'
      default:
        return gameState
    }
  }

  if (!table || !handManager) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-white text-xl">Initializing game...</div>
      </div>
    )
  }

  return (
    <div className="h-full w-full bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none bg-gray-800 px-2 py-0.5 flex justify-between items-center border-b border-gray-700">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-bold text-white">Texas Hold'em</h1>
          <p className="text-[9px] text-gray-400">
            Hand #{handManager.getHandNumber()} • {getStateDescription()}
          </p>
        </div>

        {/* Game Controls */}
        {gameState === GameState.ReadyToStart && (
          <button
            onClick={handleStartHand}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-0.5 px-2 rounded transition-colors text-[10px]"
          >
            Start Hand
          </button>
        )}
      </div>

      {/* Main Content: Table + Action Log */}
      <div className="flex-1 flex gap-1.5 p-1.5 overflow-hidden min-h-0">
        {/* Left: Poker Table */}
        <div className="w-3/5 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0">
            <PokerTable
              players={players}
              communityCards={communityCards.map((shorthand) => ({
                shorthand,
                rank: shorthand[0] as any,
                suit: shorthand.slice(1) as any,
                value: 0,
                compareTo: () => 0,
              }))}
              pot={currentPot}
              buttonPosition={buttonPosition}
              currentPlayerToAct={playerToAct}
              humanPlayerId={currentPlayerId ?? ''}
            />
          </div>
        </div>

        {/* Right: Action Log */}
        <div className="w-2/5 min-h-0 flex flex-col">
          <ActionLog messages={actionLog} />
        </div>
      </div>

      {/* Bottom: Player Actions */}
      <div className="flex-none bg-gray-800 px-2 py-1 border-t border-gray-700">
        {humanPlayer && currentPlayerId && (
          <div className="flex gap-3">
            {/* Left Third: Action Buttons */}
            <div className="w-1/3 flex flex-col">
              <h2 className="text-white text-xs font-semibold mb-1">Your Actions</h2>
              <PlayerActions
                player={humanPlayer}
                gameState={gameState}
                onAction={handlePlayerAction}
                disabled={playerToAct?.id !== currentPlayerId}
                callAmount={callAmount}
                minBet={minRaise}
                maxBet={humanPlayer.chips}
              />
            </div>

            {/* Middle Third: Player Info */}
            <div className="w-1/3 flex flex-col justify-center items-center">
              <div className="text-center">
                <div className="text-[10px] text-gray-400 mb-1">Your Chips</div>
                <div className="font-bold text-yellow-400 text-lg mb-2">${humanPlayer.chips}</div>
                <div className="text-[10px] text-gray-400 mb-1">Your Cards</div>
                <div className="font-bold text-white text-base">
                  {humanPlayer.getHoleCards().length > 0
                    ? humanPlayer.getHoleCards().map((c) => c.shorthand).join(' ')
                    : 'No cards'}
                </div>
              </div>
            </div>

            {/* Right Third: Reserved */}
            <div className="w-1/3">
              {/* Reserved for future use */}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
