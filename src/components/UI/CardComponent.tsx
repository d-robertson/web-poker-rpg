import { Card, Suit } from '../../models/Card'

interface CardComponentProps {
  card: Card
  faceDown?: boolean
  className?: string
}

export function CardComponent({ card, faceDown = false, className = '' }: CardComponentProps) {
  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds
  const colorClass = isRed ? 'text-red-600' : 'text-gray-900'

  if (faceDown) {
    return (
      <div
        className={`w-16 h-24 bg-blue-800 border-2 border-blue-900 rounded-lg flex items-center justify-center shadow-lg ${className}`}
      >
        <div className="text-blue-900 text-2xl font-bold">🂠</div>
      </div>
    )
  }

  return (
    <div
      className={`w-16 h-24 bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center justify-between p-2 shadow-lg ${className}`}
      title={card.description}
    >
      <div className={`text-xl font-bold ${colorClass}`}>{card.rank}</div>
      <div className={`text-3xl ${colorClass}`}>{card.suit}</div>
      <div className={`text-xl font-bold ${colorClass}`}>{card.rank}</div>
    </div>
  )
}
