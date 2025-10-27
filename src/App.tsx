import { useState } from 'react'
import { HandEvaluatorTestPage } from './components/UI/HandEvaluatorTestPage'
import { CasinoTest } from './components/CasinoTest'
import { PokerGame } from './components/PokerGame'

function App() {
  const [page, setPage] = useState<'game' | 'casino' | 'hand-evaluator'>('game')

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <nav className="flex-none bg-gray-800 text-white px-3 py-1.5">
        <div className="flex gap-2">
          <button
            onClick={() => setPage('game')}
            className={`px-2 py-1 rounded text-xs ${
              page === 'game' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Play Game
          </button>
          <button
            onClick={() => setPage('casino')}
            className={`px-2 py-1 rounded text-xs ${
              page === 'casino' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Casino
          </button>
          <button
            onClick={() => setPage('hand-evaluator')}
            className={`px-2 py-1 rounded text-xs ${
              page === 'hand-evaluator' ? 'bg-gray-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            Hand Evaluator
          </button>
        </div>
      </nav>

      <div className="flex-1 overflow-hidden">
        {page === 'game' && <PokerGame />}
        {page === 'casino' && <CasinoTest />}
        {page === 'hand-evaluator' && <HandEvaluatorTestPage />}
      </div>
    </div>
  )
}

export default App
