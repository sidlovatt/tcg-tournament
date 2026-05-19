'use client'
import { useState } from 'react'

export default function PairingCard({ pairing, player1, player2, isTD, format, onSubmitResult }) {
  const [submitting, setSubmitting] = useState(false)
  const [p1GW, setP1GW] = useState('')
  const [p2GW, setP2GW] = useState('')
  const [showGameScore, setShowGameScore] = useState(false)

  const isBye = !player2
  const isPending = pairing.result === 'pending'

  const resultLabels = {
    player1: `${player1?.name} wins`,
    player2: `${player2?.name} wins`,
    draw: 'Draw',
    pending: 'Pending',
  }

  async function submitResult(result) {
    setSubmitting(true)
    try {
      const p1GameWins = format === 'bo3' && p1GW !== '' ? Number(p1GW) : undefined
      const p2GameWins = format === 'bo3' && p2GW !== '' ? Number(p2GW) : undefined
      await onSubmitResult(pairing.id, result, p1GameWins, p2GameWins)
    } finally {
      setSubmitting(false)
    }
  }

  if (isBye) {
    return (
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs uppercase tracking-wider">Bye</span>
            <div className="font-semibold text-slate-200 mt-0.5">{player1?.name}</div>
          </div>
          <span className="text-emerald-400 text-sm font-medium">Auto-win (3 pts)</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-slate-800 rounded-xl p-4 border ${isPending ? 'border-slate-700' : 'border-slate-600'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-500 text-xs">Table {pairing.table_number}</span>
        {!isPending && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            pairing.result === 'draw' ? 'bg-slate-600 text-slate-300' : 'bg-emerald-900 text-emerald-300'
          }`}>
            {resultLabels[pairing.result]}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 bg-slate-900 rounded-lg px-3 py-2 text-center">
          <span className="text-slate-100 font-semibold">{player1?.name}</span>
        </div>
        <span className="text-slate-500 font-bold text-sm">vs</span>
        <div className="flex-1 bg-slate-900 rounded-lg px-3 py-2 text-center">
          <span className="text-slate-100 font-semibold">{player2?.name}</span>
        </div>
      </div>

      {/* Game score input for BO3 */}
      {isPending && format === 'bo3' && (
        <div className="mb-3">
          <button
            onClick={() => setShowGameScore(s => !s)}
            className="text-xs text-violet-400 hover:text-violet-300 mb-2"
          >
            {showGameScore ? 'Hide game score' : '+ Enter game score (optional)'}
          </button>
          {showGameScore && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={2}
                placeholder={player1?.name}
                value={p1GW}
                onChange={e => setP1GW(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:border-violet-500"
              />
              <span className="text-slate-500 text-sm">-</span>
              <input
                type="number"
                min={0}
                max={2}
                placeholder={player2?.name}
                value={p2GW}
                onChange={e => setP2GW(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-sm focus:outline-none focus:border-violet-500"
              />
            </div>
          )}
        </div>
      )}

      {/* Result buttons */}
      {isPending && isTD && (
        <div className="flex gap-2">
          <button
            onClick={() => submitResult('player1')}
            disabled={submitting}
            className="flex-1 bg-slate-700 hover:bg-emerald-700 text-slate-200 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {player1?.name} wins
          </button>
          <button
            onClick={() => submitResult('draw')}
            disabled={submitting}
            className="bg-slate-700 hover:bg-slate-600 text-slate-400 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            Draw
          </button>
          <button
            onClick={() => submitResult('player2')}
            disabled={submitting}
            className="flex-1 bg-slate-700 hover:bg-emerald-700 text-slate-200 text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {player2?.name} wins
          </button>
        </div>
      )}
    </div>
  )
}
