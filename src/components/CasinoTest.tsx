import { useState } from 'react'
import { Casino } from '../models/Casino'
import { Cashier } from '../models/Cashier'
import { Player } from '../models/Player'

export function CasinoTest() {
  const [casino] = useState(() => new Casino({ name: 'Lucky 7 Casino' }))
  const [cashier] = useState(() => new Cashier())
  const [refresh, setRefresh] = useState(0)

  // Initialize with some tables
  if (casino.tableCount === 0) {
    casino.createTable({
      name: 'Beginner Table',
      maxSeats: 6,
      smallBlind: 5,
      bigBlind: 10,
      minBuyIn: 100,
      maxBuyIn: 1000,
    })

    casino.createTable({
      name: 'High Roller Table',
      maxSeats: 9,
      smallBlind: 25,
      bigBlind: 50,
      minBuyIn: 1000,
      maxBuyIn: 10000,
    })

    // Register some test players
    cashier.registerPlayer('player1', 'Alice', 5000)
    cashier.registerPlayer('player2', 'Bob', 3000)
    cashier.registerPlayer('player3', 'Charlie', 10000)
  }

  const tables = casino.getAllTables()
  const availableTables = casino.getAvailableTables()
  const casinoStats = casino.getStatistics()
  const cashierStats = cashier.getStatistics()
  const bankrolls = cashier.getAllBankrolls()

  const handleBuyIn = (playerId: string, amount: number) => {
    try {
      cashier.buyIn(playerId, amount)
      setRefresh((r) => r + 1)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Buy-in failed')
    }
  }

  const handleCashOut = (playerId: string, amount: number) => {
    try {
      cashier.cashOut(playerId, amount)
      setRefresh((r) => r + 1)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Cash-out failed')
    }
  }

  const handleSeatPlayer = (
    tableId: string,
    playerId: string,
    seatPosition: number,
    buyInAmount: number
  ) => {
    try {
      const player = new Player(playerId, playerId, buyInAmount)
      casino.seatPlayerAtTable(tableId, player, seatPosition, buyInAmount)
      setRefresh((r) => r + 1)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to seat player')
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{casino.casinoName}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Casino Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Casino Statistics</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tables:</span>
              <span className="font-semibold">{casinoStats.totalTables}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Available Tables:</span>
              <span className="font-semibold">{casinoStats.availableTables}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Players:</span>
              <span className="font-semibold">{casinoStats.totalPlayers}</span>
            </div>
          </div>
        </div>

        {/* Cashier Statistics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Cashier Statistics</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Registered Players:</span>
              <span className="font-semibold">{cashierStats.totalPlayers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Cash:</span>
              <span className="font-semibold">${cashierStats.totalCash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Chips:</span>
              <span className="font-semibold">{cashierStats.totalChips}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transactions:</span>
              <span className="font-semibold">{cashierStats.totalTransactions}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Tables</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tables.map((tableInfo) => (
            <div key={tableInfo.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{tableInfo.name}</h3>
                  <p className="text-sm text-gray-500">ID: {tableInfo.id}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tableInfo.currentPlayers < tableInfo.maxPlayers
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {tableInfo.currentPlayers}/{tableInfo.maxPlayers}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Blinds:</p>
                  <p className="font-semibold">
                    ${tableInfo.smallBlind}/${tableInfo.bigBlind}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Buy-in:</p>
                  <p className="font-semibold">
                    ${tableInfo.minBuyIn} - ${tableInfo.maxBuyIn}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Bankrolls */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Player Bankrolls</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Chips
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Worth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {bankrolls.map((bankroll) => (
                <tr key={bankroll.playerId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {bankroll.playerName}
                    </div>
                    <div className="text-sm text-gray-500">{bankroll.playerId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${bankroll.cash}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{bankroll.chips}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      ${cashier.getPlayerTotalWorth(bankroll.playerId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleBuyIn(bankroll.playerId, 100)}
                      className="text-blue-600 hover:text-blue-900"
                      disabled={bankroll.cash < 100}
                    >
                      Buy-in $100
                    </button>
                    <button
                      onClick={() => handleCashOut(bankroll.playerId, 100)}
                      className="text-green-600 hover:text-green-900"
                      disabled={bankroll.chips < 100}
                    >
                      Cash-out $100
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Recent Transactions</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cashier.getRecentTransactions(10).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.playerId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        transaction.type === 'buy-in'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${transaction.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.timestamp.toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
