// Simple bracket display for knockout tournaments
export default function Bracket({ pairings, players, currentRound }) {
  const byRound = {}
  for (const p of pairings) {
    if (!byRound[p.round]) byRound[p.round] = []
    byRound[p.round].push(p)
  }

  const getPlayer = id => players.find(p => p.id === id)

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6 min-w-max pb-4">
        {Object.keys(byRound).sort((a, b) => Number(a) - Number(b)).map(round => (
          <div key={round} className="flex flex-col gap-3">
            <div className="text-xs text-slate-500 uppercase tracking-wider text-center mb-1">
              {byRound[round][0]?.bracket_round === 'losers' ? 'Losers' : 'Round'} {round}
            </div>
            {byRound[round].map(pairing => {
              const p1 = getPlayer(pairing.player1_id)
              const p2 = pairing.player2_id ? getPlayer(pairing.player2_id) : null
              const winner =
                pairing.result === 'player1' ? pairing.player1_id :
                pairing.result === 'player2' ? pairing.player2_id : null

              return (
                <div key={pairing.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden w-48">
                  <PlayerSlot
                    player={p1}
                    isWinner={winner === pairing.player1_id}
                    isPending={pairing.result === 'pending'}
                  />
                  <div className="h-px bg-slate-700" />
                  <PlayerSlot
                    player={p2}
                    isWinner={winner === pairing.player2_id}
                    isPending={pairing.result === 'pending'}
                    isBye={!p2}
                  />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function PlayerSlot({ player, isWinner, isPending, isBye }) {
  if (isBye) {
    return <div className="px-3 py-2 text-slate-600 text-sm italic">BYE</div>
  }
  return (
    <div className={`px-3 py-2 flex items-center justify-between gap-2 ${
      isWinner ? 'bg-emerald-900/30' : ''
    }`}>
      <span className={`text-sm font-medium truncate ${isWinner ? 'text-emerald-300' : 'text-slate-300'}`}>
        {player?.name || '—'}
      </span>
      {isWinner && <span className="text-emerald-400 text-xs">✓</span>}
    </div>
  )
}
