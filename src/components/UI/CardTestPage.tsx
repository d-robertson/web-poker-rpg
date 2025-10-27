import { Card, Rank, Suit } from '../../models/Card'
import { CardComponent } from './CardComponent'

export function CardTestPage() {
  // Create some sample cards to display
  const sampleCards = [
    new Card(Rank.Ace, Suit.Spades),
    new Card(Rank.King, Suit.Hearts),
    new Card(Rank.Queen, Suit.Diamonds),
    new Card(Rank.Jack, Suit.Clubs),
    new Card(Rank.Ten, Suit.Spades),
    new Card(Rank.Five, Suit.Hearts),
    new Card(Rank.Two, Suit.Diamonds),
  ]

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Card Model Test</h1>
        <p className="text-gray-400 mb-8">Testing the Card model and CardComponent UI</p>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Sample Cards</h2>
          <div className="flex flex-wrap gap-4">
            {sampleCards.map((card, index) => (
              <CardComponent key={index} card={card} />
            ))}
            <CardComponent card={sampleCards[0]} faceDown />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Card Information</h2>
          <div className="bg-gray-800 rounded-lg p-4">
            {sampleCards.map((card, index) => (
              <div key={index} className="mb-2">
                <span className="font-mono">{card.shorthand}</span>
                <span className="text-gray-400 ml-4">{card.description}</span>
                <span className="text-gray-500 ml-4">Value: {card.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Card Comparison</h2>
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="mb-2">
              {sampleCards[0]?.shorthand} vs {sampleCards[1]?.shorthand}:{' '}
              {sampleCards[0]?.compareTo(sampleCards[1]!) > 0 ? 'First card wins' : 'Second card wins'}
            </p>
            <p className="mb-2">
              {sampleCards[0]?.shorthand} and {sampleCards[4]?.shorthand} same suit?{' '}
              {sampleCards[0]?.hasSameSuit(sampleCards[4]!) ? 'Yes' : 'No'}
            </p>
            <p>
              Ace value: {sampleCards[0]?.value} (highest rank)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
