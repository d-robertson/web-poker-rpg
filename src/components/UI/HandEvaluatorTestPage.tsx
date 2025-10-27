import { HandEvaluator } from '../../engine/HandEvaluator'
import { createCard } from '../../models/Card'
import { CardComponent } from './CardComponent'

export function HandEvaluatorTestPage() {
  // Example hands for each rank
  const exampleHands = [
    {
      name: 'Royal Flush',
      cards: ['A♠', 'K♠', 'Q♠', 'J♠', 'T♠'],
    },
    {
      name: 'Straight Flush',
      cards: ['9♥', '8♥', '7♥', '6♥', '5♥'],
    },
    {
      name: 'Four of a Kind',
      cards: ['K♦', 'K♣', 'K♥', 'K♠', 'A♦'],
    },
    {
      name: 'Full House',
      cards: ['Q♠', 'Q♥', 'Q♦', 'J♣', 'J♠'],
    },
    {
      name: 'Flush',
      cards: ['A♣', 'J♣', '9♣', '6♣', '3♣'],
    },
    {
      name: 'Straight',
      cards: ['T♦', '9♠', '8♥', '7♣', '6♦'],
    },
    {
      name: 'Three of a Kind',
      cards: ['8♠', '8♥', '8♦', 'A♣', 'K♠'],
    },
    {
      name: 'Two Pair',
      cards: ['A♠', 'A♥', 'K♦', 'K♣', 'Q♠'],
    },
    {
      name: 'Pair',
      cards: ['J♠', 'J♥', 'T♦', '9♣', '7♠'],
    },
    {
      name: 'High Card',
      cards: ['A♠', 'K♥', 'Q♦', 'J♣', '9♠'],
    },
  ]

  // Texas Hold'em example
  const texasHoldemExample = {
    holeCards: ['A♠', 'K♠'],
    communityCards: ['Q♠', 'J♠', 'T♠', '8♥', '7♦'],
    allCards: ['A♠', 'K♠', 'Q♠', 'J♠', 'T♠', '8♥', '7♦'],
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Hand Evaluator Test</h1>
        <p className="text-gray-400 mb-8">Testing the Poker Hand Evaluation Engine</p>

        {/* 5-Card Hand Examples */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">5-Card Poker Hands</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exampleHands.map((example, index) => {
              const cards = example.cards.map((c) => createCard(c))
              const evaluation = HandEvaluator.evaluateHand(cards)

              return (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-xl font-semibold mb-3 text-blue-400">
                    {evaluation.name}
                  </h3>
                  <div className="flex gap-2 mb-3">
                    {cards.map((card, cardIndex) => (
                      <CardComponent key={cardIndex} card={card} className="w-12 h-18 text-sm" />
                    ))}
                  </div>
                  <div className="text-sm text-gray-300">
                    <p>{evaluation.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Texas Hold'em 7-Card Example */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Texas Hold'em (7-Card Evaluation)</h2>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-green-400">Your Hole Cards</h3>
              <div className="flex gap-2">
                {texasHoldemExample.holeCards.map((cardStr, index) => (
                  <CardComponent
                    key={index}
                    card={createCard(cardStr)}
                    className="w-16 h-24"
                  />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-yellow-400">Community Cards</h3>
              <div className="flex gap-2">
                {texasHoldemExample.communityCards.map((cardStr, index) => (
                  <CardComponent
                    key={index}
                    card={createCard(cardStr)}
                    className="w-16 h-24"
                  />
                ))}
              </div>
            </div>

            <div className="border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-2 text-purple-400">Best Hand</h3>
              {(() => {
                const allCards = texasHoldemExample.allCards.map((c) => createCard(c))
                const bestHand = HandEvaluator.evaluateBest7CardHand(allCards)

                return (
                  <div>
                    <div className="flex gap-2 mb-3">
                      {bestHand.cards.map((card, index) => (
                        <CardComponent key={index} card={card} className="w-14 h-20 text-sm" />
                      ))}
                    </div>
                    <div className="text-lg">
                      <span className="font-bold text-blue-400">{bestHand.name}</span>
                      <span className="text-gray-400 ml-2">- {bestHand.description}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>

        {/* Hand Comparison Example */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">Hand Comparison</h2>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Hand 1 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-400">Player 1</h3>
                {(() => {
                  const cards = ['A♠', 'A♥', 'K♦', 'K♣', 'Q♠'].map((c) => createCard(c))
                  const hand = HandEvaluator.evaluateHand(cards)

                  return (
                    <div>
                      <div className="flex gap-2 mb-3">
                        {cards.map((card, index) => (
                          <CardComponent key={index} card={card} className="w-12 h-18 text-sm" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-300">{hand.description}</p>
                    </div>
                  )
                })()}
              </div>

              {/* Hand 2 */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-400">Player 2</h3>
                {(() => {
                  const cards = ['K♠', 'K♥', 'Q♦', 'Q♣', 'J♠'].map((c) => createCard(c))
                  const hand = HandEvaluator.evaluateHand(cards)

                  return (
                    <div>
                      <div className="flex gap-2 mb-3">
                        {cards.map((card, index) => (
                          <CardComponent key={index} card={card} className="w-12 h-18 text-sm" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-300">{hand.description}</p>
                    </div>
                  )
                })()}
              </div>
            </div>

            {/* Result */}
            <div className="border-t border-gray-700 pt-4">
              {(() => {
                const hand1 = HandEvaluator.evaluateHand(
                  ['A♠', 'A♥', 'K♦', 'K♣', 'Q♠'].map((c) => createCard(c))
                )
                const hand2 = HandEvaluator.evaluateHand(
                  ['K♠', 'K♥', 'Q♦', 'Q♣', 'J♠'].map((c) => createCard(c))
                )
                const comparison = hand1.compareTo(hand2)

                return (
                  <div className="text-center">
                    <p className="text-xl font-bold text-yellow-400">
                      {comparison > 0 ? 'Player 1 Wins!' : comparison < 0 ? 'Player 2 Wins!' : "It's a Tie!"}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {comparison > 0
                        ? 'Aces and Kings beats Kings and Queens'
                        : 'Higher two pair wins'}
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
