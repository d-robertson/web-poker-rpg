import { Player } from '../models/Player'
import { Card as CardModel } from '../models/Card'

interface PokerTableProps {
  players: Player[]
  communityCards: CardModel[]
  pot: number
  buttonPosition: number
  currentPlayerToAct?: Player | null
  humanPlayerId: string
}

// Helper function to get position name based on seat and button position
function getPositionName(seatIndex: number, buttonPosition: number, totalPlayers: number): string {
  if (buttonPosition === -1) return ''

  const maxSeats = 9
  const relativePosition = (seatIndex - buttonPosition + maxSeats) % maxSeats

  // Position mapping based on distance from button
  if (relativePosition === 0) return 'BTN'
  if (relativePosition === 1) return 'SB'
  if (relativePosition === 2) return 'BB'

  // For 6-max or fewer players
  if (totalPlayers <= 6) {
    if (relativePosition === 3) return 'UTG'
    if (relativePosition === 4) return totalPlayers === 6 ? 'HJ' : 'CO'
    if (relativePosition === 5) return 'CO'
  } else {
    // For 7-9 players (full ring)
    if (relativePosition === 3) return 'UTG'
    if (relativePosition === 4) return 'UTG+1'
    if (relativePosition === 5) return 'MP'
    if (relativePosition === 6) return 'LJ'
    if (relativePosition === 7) return 'HJ'
    if (relativePosition === 8) return 'CO'
  }

  return ''
}

// Fixed seat positions for exact placement (left%, top%)
const SEAT_POSITIONS = [
  { left: '50%', top: '2%' },    // Seat 0: Dealer - top center
  { left: '78%', top: '13%' },   // Seat 1: top right (moved down 30px ≈ 5%)
  { left: '91%', top: '40%' },   // Seat 2: right (moved right 30px ≈ 3%, down 30px ≈ 5%)
  { left: '84%', top: '72%' },   // Seat 3: bottom right (moved right 60px ≈ 6%, down 60px ≈ 10%)
  { left: '50%', top: '80%' },   // Seat 4: bottom center (moved down 30px ≈ 5%)
  { left: '16%', top: '72%' },   // Seat 5: bottom left (moved left 60px ≈ 6%, down 60px ≈ 10%)
  { left: '9%', top: '40%' },    // Seat 6: left (moved left 30px ≈ 3%, down 30px ≈ 5%)
  { left: '22%', top: '13%' },   // Seat 7: top left (moved down 30px ≈ 5%)
  { left: '50%', top: '50%' },   // Seat 8: center (unused, for expansion)
]

export function PokerTable({
  players,
  communityCards,
  pot,
  buttonPosition,
  currentPlayerToAct,
  humanPlayerId,
}: PokerTableProps) {
  // Arrange players in seats (seat 0 is dealer, seats 1-7 for players)
  const seats = Array(8).fill(null) // Only 8 seats: dealer + 7 players
  // Seat 0 is reserved for dealer position
  players.forEach((player) => {
    const seatIndex = players.indexOf(player)
    // Players occupy seats 1-7 (seat 0 is dealer)
    if (seatIndex < 7) {
      seats[seatIndex + 1] = player
    }
  })

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-green-800 to-green-900 rounded-xl shadow-lg overflow-hidden">
      {/* Table felt */}
      <div className="absolute inset-4 bg-green-700 rounded-full border-2 border-green-900">
        {/* Pot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="bg-black bg-opacity-40 px-2 py-1 rounded">
            <div className="text-yellow-400 font-bold text-xs mb-0">POT</div>
            <div className="text-white font-bold text-sm">${pot}</div>
          </div>

          {/* Community Cards */}
          {communityCards.length > 0 && (
            <div className="flex gap-0.5 justify-center mt-1">
              {communityCards.map((card, i) => (
                <Card key={i} card={card.shorthand} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Seats - Dealer at 0, Players at 1-8 */}
      {seats.map((player, index) => {
        const position = SEAT_POSITIONS[index]
        if (!position) return null

        // Seat 0 is the dealer position
        if (index === 0) {
          return (
            <div
              key="dealer"
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: position.left, top: position.top }}
            >
              <div className="bg-gray-900 rounded p-1.5 shadow-md border-2 border-yellow-500">
                <div className="text-yellow-400 font-bold text-xs text-center">DEALER</div>
              </div>
            </div>
          )
        }

        // Seats 1-8 are for players
        const playerIndex = index - 1 // Convert seat index to player index

        // Show empty seat if no player
        if (!player) {
          return (
            <div
              key={`empty-${index}`}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: position.left, top: position.top }}
            >
              <EmptySeat seatNumber={index} />
            </div>
          )
        }

        const isActive = currentPlayerToAct?.id === player.id
        const isHuman = player.id === humanPlayerId
        const positionName = getPositionName(playerIndex, buttonPosition, players.length)

        return (
          <div
            key={player.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: position.left, top: position.top }}
          >
            <PlayerSeat
              player={player}
              isActive={isActive}
              isHuman={isHuman}
              hasButton={buttonPosition === playerIndex}
              positionName={positionName}
            />
          </div>
        )
      })}
    </div>
  )
}

interface PlayerSeatProps {
  player: Player
  isActive: boolean
  isHuman: boolean
  hasButton: boolean
  positionName: string
}

function PlayerSeat({ player, isActive, isHuman, hasButton, positionName }: PlayerSeatProps) {
  const cards = player.getHoleCards()

  return (
    <div className="relative w-24">
      {/* Dealer Button - Smaller */}
      {hasButton && (
        <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-200 to-yellow-400 text-black font-black rounded-full w-6 h-6 flex items-center justify-center border border-yellow-600 shadow-md z-20">
          <span className="text-xs">D</span>
        </div>
      )}

      {/* Action Indicator - Glowing Ring */}
      {isActive && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded blur-sm opacity-75 animate-pulse"></div>
      )}

      {/* Player Info */}
      <div
        className={`relative bg-gray-800 rounded p-1.5 shadow-md border ${
          isActive ? 'border-yellow-400' : 'border-gray-700'
        } ${player.hasFolded ? 'opacity-50' : ''}`}
      >
        {/* Position Label */}
        {positionName && (
          <div
            className={`absolute -top-1 left-1/2 transform -translate-x-1/2 px-1 py-0 rounded text-[9px] font-bold ${
              positionName === 'BTN'
                ? 'bg-yellow-500 text-black'
                : positionName === 'SB'
                  ? 'bg-blue-500 text-white'
                  : positionName === 'BB'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-600 text-white'
            }`}
          >
            {positionName}
          </div>
        )}

        {/* Name */}
        <div className="text-white font-semibold text-[10px] mb-0.5 truncate mt-0.5">
          {player.name}
          {isHuman && ' 👤'}
        </div>

        {/* Chips */}
        <div className="text-yellow-400 font-bold text-xs mb-0.5">
          ${player.chips}
        </div>

        {/* Cards */}
        {cards.length > 0 && (
          <div className="flex gap-0.5 justify-center">
            {isHuman || player.hasFolded ? (
              // Show cards for human player or if folded
              cards.map((card, i) => <Card key={i} card={card.shorthand} size="sm" />)
            ) : (
              // Show card backs for other players
              <>
                <CardBack size="sm" />
                <CardBack size="sm" />
              </>
            )}
          </div>
        )}

        {/* Current Bet - More Prominent */}
        {player.currentBetAmount > 0 && (
          <div className="mt-0.5 text-center">
            <div
              className={`inline-block px-1.5 py-0 rounded-full font-bold text-[9px] ${
                positionName === 'SB' || positionName === 'BB'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
            >
              {positionName === 'SB' && 'SB: '}
              {positionName === 'BB' && 'BB: '}
              ${player.currentBetAmount}
            </div>
          </div>
        )}

        {/* Status */}
        {player.hasFolded && (
          <div className="mt-0.5 text-center text-red-400 font-semibold text-[9px]">
            FOLDED
          </div>
        )}
        {player.isAllIn && (
          <div className="mt-0.5 text-center bg-yellow-500 text-black font-bold text-[9px] py-0 rounded">
            ALL-IN
          </div>
        )}

        {/* Last Action - Only show if not folded and not all-in */}
        {!player.hasFolded && !player.isAllIn && player.getLastAction && (
          <div className="mt-0.5 text-center">
            {player.getLastAction === 'CHECK' && (
              <div className="text-blue-400 font-semibold text-[9px]">✓ CHECK</div>
            )}
            {player.getLastAction === 'CALL' && (
              <div className="text-green-400 font-semibold text-[9px]">📞 CALL</div>
            )}
            {player.getLastAction === 'BET' && (
              <div className="text-yellow-400 font-semibold text-[9px]">💵 BET</div>
            )}
            {player.getLastAction === 'RAISE' && (
              <div className="text-orange-400 font-semibold text-[9px]">📈 RAISE</div>
            )}
          </div>
        )}

        {/* Active Indicator */}
        {isActive && (
          <div className="mt-0.5 text-center bg-yellow-400 text-black font-bold text-[9px] py-0 rounded animate-pulse">
            ⏰ TURN
          </div>
        )}
      </div>
    </div>
  )
}

interface CardProps {
  card: string
  size?: 'sm' | 'md'
}

function Card({ card, size = 'md' }: CardProps) {
  const isRed = card.includes('♥') || card.includes('♦')
  const sizeClass = size === 'sm' ? 'w-5 h-7 text-[9px]' : 'w-8 h-11 text-[10px]'

  return (
    <div
      className={`${sizeClass} bg-white rounded border border-gray-300 shadow-sm flex items-center justify-center font-bold ${
        isRed ? 'text-red-600' : 'text-black'
      }`}
    >
      {card}
    </div>
  )
}

function CardBack({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-5 h-7' : 'w-8 h-11'

  return (
    <div
      className={`${sizeClass} bg-gradient-to-br from-blue-600 to-blue-800 rounded border border-blue-900 shadow-sm flex items-center justify-center`}
    >
      <div className="text-white text-[9px]">🂠</div>
    </div>
  )
}

function EmptySeat({ seatNumber }: { seatNumber: number }) {
  return (
    <div className="w-24">
      <div className="bg-gray-800 bg-opacity-50 rounded p-1.5 shadow-md border border-gray-600 border-dashed">
        <div className="text-gray-500 text-center text-[10px]">
          Seat {seatNumber}
        </div>
        <div className="text-gray-600 text-center text-[9px] mt-0.5">
          Empty
        </div>
      </div>
    </div>
  )
}
