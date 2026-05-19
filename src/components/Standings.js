import { getStandings } from '@/lib/swiss'

export default function Standings({ players, pairings, showTiebreakers = false }) {
  const standings = getStandings(players, pairings)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
            <th className="pb-2 pr-3">#</th>
            <th className="pb-2 pr-3">Player</th>
            <th className="pb-2 pr-3 text-center">Pts</th>
            <th className="pb-2 pr-3 text-center">W-L-D</th>
            {showTiebreakers && (
              <>
                <th className="pb-2 pr-3 text-center">OMW%</th>
                <th className="pb-2 text-center">GW%</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {standings.map((player, idx) => (
            <tr key={player.id} className="hover:bg-slate-800/50">
              <td className="py-2.5 pr-3">
                <span className={`text-xs font-bold ${
                  idx === 0 ? 'text-amber-400' :
                  idx === 1 ? 'text-slate-300' :
                  idx === 2 ? 'text-amber-700' :
                  'text-slate-600'
                }`}>
                  {idx + 1}
                </span>
              </td>
              <td className="py-2.5 pr-3 font-medium text-slate-100">
                {player.name}
                {player.eliminated && (
                  <span className="ml-2 text-xs text-red-500">Elim.</span>
                )}
              </td>
              <td className="py-2.5 pr-3 text-center font-bold text-violet-400">{player.points}</td>
              <td className="py-2.5 pr-3 text-center text-slate-400">
                {player.wins}-{player.losses}-{player.draws}
              </td>
              {showTiebreakers && (
                <>
                  <td className="py-2.5 pr-3 text-center text-slate-500">{(player.omw * 100).toFixed(1)}%</td>
                  <td className="py-2.5 text-center text-slate-500">{(player.gwp * 100).toFixed(1)}%</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
