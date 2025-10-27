import { useState } from 'react'
import { Player } from '../models/Player'
import { GameState } from '../engine/GameState'

interface PlayerActionsProps {
  player: Player
  gameState: GameState
  onAction: (action: 'fold' | 'check' | 'call' | 'bet' | 'raise', amount?: number) => void
  disabled?: boolean
  callAmount?: number
  minBet?: number
  maxBet?: number
}

export function PlayerActions({
  player,
  gameState,
  onAction,
  disabled = false,
  callAmount = 0,
  minBet = 10,
  maxBet,
}: PlayerActionsProps) {
  const [betAmount, setBetAmount] = useState(minBet)
  const [showBetInput, setShowBetInput] = useState(false)

  // Check if we're in a betting round
  const isBettingRound = [
    GameState.PreflopBetting,
    GameState.FlopBetting,
    GameState.TurnBetting,
    GameState.RiverBetting,
  ].includes(gameState)

  if (!isBettingRound || disabled) {
    return (
      <div className="p-0">
        <p className="text-gray-400 text-center text-[10px]">Waiting for next action...</p>
      </div>
    )
  }

  const effectiveMaxBet = maxBet ?? player.chips
  const canCheck = callAmount === 0
  const canCall = callAmount > 0 && callAmount <= player.chips
  const canBet = player.currentBetAmount === 0 && player.chips > 0
  const canRaise = player.currentBetAmount > 0 && player.chips > callAmount

  const handleBetClick = () => {
    setShowBetInput(true)
  }

  const handleBetConfirm = () => {
    if (betAmount >= minBet && betAmount <= effectiveMaxBet) {
      if (player.currentBetAmount === 0) {
        onAction('bet', betAmount)
      } else {
        onAction('raise', betAmount)
      }
      setShowBetInput(false)
      setBetAmount(minBet)
    }
  }

  const handleBetCancel = () => {
    setShowBetInput(false)
    setBetAmount(minBet)
  }

  if (showBetInput) {
    return (
      <div className="p-0">
        <div className="mb-1">
          <label className="block text-white font-semibold mb-0.5 text-[10px]">
            {player.currentBetAmount === 0 ? 'Bet Amount' : 'Raise Amount'}
          </label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min={minBet}
            max={effectiveMaxBet}
            className="w-full px-1.5 py-0.5 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-xs"
          />
          <input
            type="range"
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            min={minBet}
            max={effectiveMaxBet}
            className="w-full mt-0.5"
          />
          <div className="flex justify-between text-[9px] text-gray-400 mt-0">
            <span>Min: ${minBet}</span>
            <span>Max: ${effectiveMaxBet}</span>
          </div>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={handleBetConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded transition-colors text-[10px]"
          >
            Confirm ${betAmount}
          </button>
          <button
            onClick={handleBetCancel}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded transition-colors text-[10px]"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-0">
      <div className="grid grid-cols-2 gap-1.5">
        {/* Fold */}
        <button
          onClick={() => onAction('fold')}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded transition-colors text-[10px]"
        >
          Fold
        </button>

        {/* Check / Call */}
        {canCheck ? (
          <button
            onClick={() => onAction('check')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded transition-colors text-[10px]"
          >
            Check
          </button>
        ) : canCall ? (
          <button
            onClick={() => onAction('call')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded transition-colors text-[10px]"
          >
            Call ${callAmount}
          </button>
        ) : (
          <button
            disabled
            className="bg-gray-600 text-gray-400 font-bold py-1 px-2 rounded cursor-not-allowed text-[10px]"
          >
            Call
          </button>
        )}

        {/* Bet / Raise */}
        {canBet || canRaise ? (
          <button
            onClick={handleBetClick}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded transition-colors col-span-2 text-[10px]"
          >
            {canBet ? 'Bet' : 'Raise'}
          </button>
        ) : null}

        {/* All-in */}
        {player.chips > 0 && (
          <button
            onClick={() => onAction('bet', player.chips)}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded transition-colors col-span-2 text-[10px]"
          >
            All-In ${player.chips}
          </button>
        )}
      </div>
    </div>
  )
}
